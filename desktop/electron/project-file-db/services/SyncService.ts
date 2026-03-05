import { HttpMethods, Service } from "~ims-app-base/logic/managers/ApiWorker";
import type { AssetsFullResult, AssetBlockParamsDTO, AssetsChangeResult, AssetSetDTO } from "~ims-app-base/logic/types/AssetsType";
import type { ChangesStreamResponse, ChangesStreamRequest, ApiResultListWithTotal } from "~ims-app-base/logic/types/ProjectTypes";
import { stringifyAssetNewBlockRef, assignPlainValueToAssetProps, type AssetProps, diffAssetPropObjects } from "~ims-app-base/logic/types/Props";
import type { ProjectFileDb, ProjectFileDbAsset, ProjectFileDbWorkspace } from "../ProjectFileDb";
import { type AssetPropWhere } from "~ims-app-base/logic/types/PropsWhere";
import type { Workspace, WorkspaceQueryDTOWhere } from "~ims-app-base/logic/types/Workspaces";
import log from 'electron-log/main';
import type { ChangeWorkspaceDTO, WorkspaceDTO } from "~ims-app-base/logic/types/RightsAndRoles";
import ApiError, { ApiErrorCodes } from "~ims-app-base/logic/types/ApiError";

const SYNC_CHUNK_SIZE = 50;
export const SQLITE_NOW_STM = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;
export type SyncTableRow = {
    id: string,
    server_state: string,
    server_deleted: number,
}

export enum SyncConflict {
    MODIFIED_DELETED = 'MODIFIED_DELETED',
    DUPLICATE = 'DUPLICATE',
    NO_ACCESS = 'NO_ACCESS',
    ERROR = 'ERROR',
}

export type WorkspaceEntity = {
    id: string;
    projectId: string;
    title: string;
    name: string | null;
    parentId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    index: number | null;
    props: AssetProps | null;
}

export class SyncService {

    private _syncProcessRunning = false;
    private _synchronizationTimer: NodeJS.Timeout | undefined;

    constructor(public db: ProjectFileDb){

    }

    init(){
        this._synchronizationTimer = setInterval(() => {
            this.syncProject();
        }, 10 * 1000);
    }

    destroy(){
        if(this._synchronizationTimer){
           clearInterval(this._synchronizationTimer); 
           this._synchronizationTimer = undefined
        }
    }

    async syncProject(){
        if (this._syncProcessRunning) return;
        let sync_log_id: number | null = null;
        try{
            this._syncProcessRunning = true;
            const insert_res: {id: number}[] = await this.db.dataSource.createQueryRunner().query(`
                INSERT INTO sync_logs (sync_start)
                VALUES (${SQLITE_NOW_STM}) RETURNING id;
            `);
            sync_log_id = insert_res[0].id;
            await this.checkUnsyncedAssetsAndWorkspaces(sync_log_id);
            await this.syncAssetsAndWorkspaces();
        }
        catch(err: any){
            if(sync_log_id) {
                await this.db.dataSource.createQueryRunner().query(`
                    UPDATE sync_logs
                    SET error = ?
                    WHERE id = ?
                `, [ err.message, sync_log_id]);  
            }
            else {
                log.error('Sync failed', err);
            }
        }
        finally {
            if(sync_log_id) {
                await this.db.dataSource.createQueryRunner().query(`
                    UPDATE sync_logs
                    SET sync_end = ${SQLITE_NOW_STM}
                    WHERE id = ?
                `, [sync_log_id]);
            }
            this._syncProcessRunning = false;
        }
    }

    async checkUnsyncedAssetsAndWorkspaces(sync_log_id: number) {
        const last_sync_db_res: {
            id: string,
            sync_start: string | null,
            sync_state: string | null
        }[] = await this.db.dataSource.createQueryRunner().query(`
            SELECT id, sync_start, sync_state
            FROM sync_logs
            WHERE error IS NULL AND sync_end IS NOT NULL
            ORDER BY id DESC
            LIMIT 1; 
        `);

        const assetDeletedIdsSet = new Set();
        const assetUpdatedIdsSet = new Set();
        const workspaceDeletedIdsSet = new Set();
        const workspaceUpdatedIdsSet = new Set(); 
    
        const asset_condition: AssetPropWhere = {
            issystem: false,
            inside: 'gdd'
        };
    
        const workspace_condition: WorkspaceQueryDTOWhere = {
            insideName: 'gdd',
        };
        let has_more = true;
        let last_asset_id = null as string | null;
        let last_workspace_id = null as string | null;
        let last_time = last_sync_db_res[0]?.sync_state;
        if(last_time) {
            while (has_more) {
                const changes: ChangesStreamResponse = await this.db.api.call(
                    Service.CREATORS,
                    HttpMethods.POST,
                    `project/changes/stream/get`, 
                    {
                        dateFrom: last_time,
                        lastAssetId: last_asset_id ?? undefined,
                        lastWorkspaceId: last_workspace_id ?? undefined,
                        count: SYNC_CHUNK_SIZE,
                        whereAssets: asset_condition,
                        whereWorkspaces: workspace_condition,                
                    } as ChangesStreamRequest
                );
                has_more = !!changes.last && changes.more;
                if (changes.last) {
                    last_time = changes.last.date;
                    last_asset_id = changes.last.assetId;
                    last_workspace_id = changes.last.workspaceId;
                }

                for(const updated_id of changes.assetUpdatedIds){
                    assetDeletedIdsSet.delete(updated_id);
                    assetUpdatedIdsSet.add(updated_id);
                }
                for(const deleted_id of changes.assetDeletedIds){
                    assetUpdatedIdsSet.delete(deleted_id);
                    assetDeletedIdsSet.add(deleted_id);
                }

                for(const updated_id of changes.workspaceUpdatedIds){
                    workspaceDeletedIdsSet.delete(updated_id);
                    workspaceUpdatedIdsSet.add(updated_id);
                }
                for(const deleted_id of changes.workspaceDeletedIds){
                    workspaceUpdatedIdsSet.delete(deleted_id);
                    workspaceDeletedIdsSet.add(deleted_id);
                }
        
                if (
                    !changes.assetDeletedIds.length &&
                    !changes.assetUpdatedIds.length &&
                    !changes.workspaceDeletedIds.length &&
                    !changes.workspaceUpdatedIds.length
                ) {
                    break;
                }
            }

            if (!last_asset_id && !last_workspace_id){

                // вставляю в state старый last time
                await this.db.dataSource.createQueryRunner().query(`
                    UPDATE sync_logs
                    SET sync_state = ?
                    WHERE id = ?
                `, [last_time, sync_log_id]);
                return; // No external changes
            }
            
            const last_time_date = new Date(last_time)
            last_time_date.setTime(last_time_date.getTime() + 1)
            last_time = last_time_date.toISOString()
        }
        else {
            let asset_processed = 0;
            let workspace_processed = 0;
            let asset_has_more = true;
            let workspace_has_more = true;
    
            while (asset_has_more || workspace_has_more) {

                const asset_ids: ApiResultListWithTotal<{id: string}> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `assets/view`, {
                    select: JSON.stringify(['id']),
                    where: JSON.stringify(asset_condition),
                    offset: asset_processed,
                    count: SYNC_CHUNK_SIZE,
                });
                asset_ids.list.forEach((a) => assetUpdatedIdsSet.add(a.id));
                asset_processed += asset_ids.list.length;
                asset_has_more = asset_processed < asset_ids.total && asset_ids.list.length > 0;

                const workspaces: ApiResultListWithTotal<Workspace> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
                    where: JSON.stringify(workspace_condition),
                    count: SYNC_CHUNK_SIZE,
                });
                    
                workspaces.list.forEach((w) => workspaceUpdatedIdsSet.add(w.id));
                workspace_processed += workspaces.list.length;
                workspace_has_more = workspace_processed < workspaces.total && workspaces.list.length > 0;
            }
            last_time = new Date().toISOString();
        }
        await this.db.dataSource.createQueryRunner().query(`
            UPDATE sync_logs
            SET sync_state = ?
            WHERE id = ?
        `, [last_time, sync_log_id]);
        if(assetUpdatedIdsSet.size > 0) {
            await this.db.dataSource.createQueryRunner().query(`
                INSERT INTO assets (id, need_sync)
                VALUES ` + [...assetUpdatedIdsSet].map(i => `(?,${SQLITE_NOW_STM})`).join(',') +
                ` ON CONFLICT (id) DO UPDATE SET need_sync = ${SQLITE_NOW_STM};
            `, [...assetUpdatedIdsSet]);
        }

        if(assetDeletedIdsSet.size > 0) {
            await this.db.dataSource.createQueryRunner().query(`
                INSERT INTO assets (id, need_sync, server_deleted)
                VALUES ` + [...assetDeletedIdsSet].map(i => `(?,${SQLITE_NOW_STM}, true)`).join(',') +
                ` ON CONFLICT (id) DO UPDATE SET need_sync = ${SQLITE_NOW_STM}, server_deleted = true;
            `, [...assetDeletedIdsSet]);
        }

        if(workspaceUpdatedIdsSet.size > 0) {
            await this.db.dataSource.createQueryRunner().query(`
                INSERT INTO workspaces (id, need_sync)
                VALUES ` + [...workspaceUpdatedIdsSet].map(i => `(?,${SQLITE_NOW_STM})`).join(',') +
                ` ON CONFLICT (id) DO UPDATE SET need_sync = ${SQLITE_NOW_STM};
            `, [...workspaceUpdatedIdsSet]);
        }

        if(workspaceDeletedIdsSet.size > 0) {
            await this.db.dataSource.createQueryRunner().query(`
                INSERT INTO workspaces (id, need_sync, server_deleted)
                VALUES ` + [...workspaceDeletedIdsSet].map(i => `(?,${SQLITE_NOW_STM}, true)`).join(',') +
                ` ON CONFLICT (id) DO UPDATE SET need_sync = ${SQLITE_NOW_STM}, server_deleted = true;
            `, [...workspaceDeletedIdsSet]);
        }
    }

    async syncAssetsAndWorkspaces() {
        const db_workspaces: SyncTableRow[] = await this.db.dataSource.createQueryRunner().query(`
            SELECT id,server_state,server_deleted
            FROM workspaces
            WHERE need_sync > synced_at OR (need_sync IS NOT NULL AND synced_at IS NULL);
        `);
        await this._syncWorkspaces(db_workspaces);
        
        const db_assets: SyncTableRow[] = await this.db.dataSource.createQueryRunner().query(`
            SELECT id,server_state,server_deleted
            FROM assets
            WHERE need_sync > synced_at OR (need_sync IS NOT NULL AND synced_at IS NULL);
        `);
        await this._syncAssets(db_assets);
    }

    private async _loadFromServerAsset(db_asset_id: string){
        const server_asset_full: AssetsFullResult = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `assets/full`, {
            where: JSON.stringify({
                id: [db_asset_id],
            })
        });
        const server_asset = server_asset_full.objects.assetFulls[db_asset_id]
        if(server_asset){
            return this.db.asset.convertServerAssetToLocal(server_asset)
        }
        else {
            return null;
        }
    }

    private async _syncAsset(db_asset: SyncTableRow){
        let conflict: SyncConflict | null = null;
        let conflict_message: string | null = null;
        let old_server_state: ProjectFileDbAsset | null = db_asset.server_state ? JSON.parse(db_asset.server_state) : null;
        let new_server_state: ProjectFileDbAsset | null;
        let local_state: ProjectFileDbAsset | null | undefined = undefined
        try {

            const was_synced_before = !!old_server_state
            if (
                !db_asset.server_deleted && 
                !old_server_state
            ){
                old_server_state = await this._loadFromServerAsset(db_asset.id);
            }

            local_state = this.db.asset.assets.byId.get(db_asset.id) ?? null

            if(old_server_state) {
                if(local_state) {
                    const changes_from_local = this.getAssetsChanges(local_state, old_server_state)
                    const has_local_changes = Object.keys(changes_from_local).length > 0
        
                    if(db_asset.server_deleted) {
                        new_server_state = null
                        if (has_local_changes){
                            conflict = SyncConflict.MODIFIED_DELETED;
                            return;
                        }
                        else {
                            await this.db.asset.assetsDelete({
                                id: [db_asset.id],
                            })
                        }
                    }
                    else if (has_local_changes){
                         const server_asset_full: AssetsFullResult = await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/change`, {
                            where: {
                                id: [db_asset.id],
                            },
                            set: changes_from_local
                        });
                        if (!server_asset_full.objects.assetFulls[db_asset.id]){
                            conflict = SyncConflict.NO_ACCESS
                            return;
                        }
                        new_server_state = this.db.asset.convertServerAssetToLocal(
                            server_asset_full.objects.assetFulls[db_asset.id]
                        ); 
                    }
                    else {
                        new_server_state = !db_asset.server_state ? old_server_state : await this._loadFromServerAsset(db_asset.id);
                        if(!new_server_state) {
                            conflict = SyncConflict.NO_ACCESS
                            return;
                        }
                    }
                }
                else if (was_synced_before) {
                    // => Deleted locally, but was synced before
                    await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/delete`, {
                        where: {
                            id: [db_asset.id],
                        }
                    });
                    new_server_state = null
                }
                else {
                    // Exists on server, but not locally
                    new_server_state = old_server_state
                }
            }
            else { 
                // Server has no file
                if (local_state){
                    try {
                        const asset_result = await this.copyAssetToServer(db_asset.id);
                        new_server_state = this.db.asset.convertServerAssetToLocal(asset_result.objects.assetFulls[db_asset.id]);
                    }
                    catch(err: any){
                        if (err instanceof ApiError && err.code === ApiErrorCodes.ENTITY_ALREADY_EXISTS){
                            conflict = SyncConflict.DUPLICATE;
                            return;
                        }
                        else {
                            throw err;
                        }
                    }
                } else {        
                    new_server_state = null
                }
            }
            if (new_server_state){
                const changes_from_server = this.getAssetsChanges(new_server_state, local_state)
                if (!local_state){
                     await this.db.asset.assetsCreate({
                        id: db_asset.id,
                        set: changes_from_server
                    });
                }
                else {
                    if(Object.keys(changes_from_server).length > 0) {     
                        await this.db.asset.assetsChange({
                            where: {
                                id: db_asset.id
                            },
                            set: changes_from_server
                        });
                    }
                }
            }  
        }
        catch(error: any) {
            if(error instanceof ApiError && error.code === ApiErrorCodes.ACCESS_DENIED){
                conflict = SyncConflict.NO_ACCESS
            }
            else {
                conflict = SyncConflict.ERROR;
            }
            conflict_message = error.message;
        }
        finally {
            const save_server_state = new_server_state! === undefined ? old_server_state : new_server_state
            if (save_server_state === null && local_state === null){                
                await this.db.dataSource.createQueryRunner().query(`
                    DELETE FROM assets
                    WHERE id = ?;
                `, [db_asset.id])
            }
            else {
                await this.db.dataSource.createQueryRunner().query(`
                    UPDATE assets
                    SET synced_at = need_sync, conflict = ?, conflict_message = ?, server_state = ?
                    WHERE id = ?;
                `, [conflict, conflict_message, JSON.stringify(save_server_state), db_asset.id]);
            }
        }
    }

    private async _syncAssets(db_assets: SyncTableRow[]){
        for(const db_asset of db_assets){
            await this._syncAsset(db_asset);
        }
    }

    getAssetsChanges(source_asset: ProjectFileDbAsset, target_asset: ProjectFileDbAsset | null): AssetSetDTO {
        const changes: AssetSetDTO = {};
        if(!target_asset || source_asset.title !== target_asset.title) {
            changes.title = source_asset.title;
        }
        if(!target_asset || source_asset.name !== target_asset.name) {
            changes.name = source_asset.name;
        }
        if(!target_asset || source_asset.index !== target_asset.index) {
            changes.index = source_asset.index;
        }
        if(!target_asset || source_asset.creatorUserId !== target_asset.creatorUserId) {
            changes.creatorUserId = source_asset.creatorUserId ?? undefined;
        }
        if(!target_asset || source_asset.icon !== target_asset.icon) {
            changes.icon = source_asset.icon;
        }
        if(!target_asset || source_asset.isAbstract !== target_asset.isAbstract) {
            changes.isAbstract = source_asset.isAbstract;
        }
        if(!target_asset || source_asset.parentIds.length !== target_asset.parentIds.length ||
            source_asset.parentIds.some((val, ind) => target_asset.parentIds[ind] !== val)
        ) {
            changes.parentIds = source_asset.parentIds;
        }
        if(!target_asset || source_asset.workspaceId !== target_asset.workspaceId) {
            changes.workspaceId = source_asset.workspaceId;
        }

        for(const source_block of source_asset.blocks){
            const target_block = target_asset ? target_asset.blocks.find(x => x.id === source_block.id) : null;
            const block_change: AssetBlockParamsDTO = {}
            let any_block_change = false;
            if(!target_block || source_block.title !== target_block.title) {
                block_change.title = source_block.title;
                any_block_change = true;
            }
            if(!target_block || source_block.name !== target_block.name) {
                block_change.name = source_block.name;
                any_block_change = true;
            }
            if(!target_block || source_block.index !== target_block.index) {
                block_change.index = source_block.index;
                any_block_change = true;
            }
            if(!target_block) {
                block_change.type = source_block.type;
                any_block_change = true;
            }
            const change_asset_props: AssetProps[] = target_block ? 
                diffAssetPropObjects(
                    assignPlainValueToAssetProps({}, source_block.props ?? {}),
                    assignPlainValueToAssetProps({}, target_block.props ?? {})
                ) :
                [assignPlainValueToAssetProps({}, source_block.props ?? {})]
            if(change_asset_props.length > 0){
                block_change.props = change_asset_props
                any_block_change = true;
            }
            if (any_block_change){
                if (!changes.blocks){
                    changes.blocks = {}
                }
                const block_key = stringifyAssetNewBlockRef(source_block.name,source_block.id)
                changes.blocks[block_key] = block_change
            }

        }
        if (target_asset){
            for(const server_block of target_asset.blocks){
                const local_block = source_asset.blocks.find(x => x.id === server_block.id);
                if(!local_block){  
                    if (!changes.blocks){
                        changes.blocks = {}
                    }
                    const block_key = stringifyAssetNewBlockRef(server_block.name,server_block.id)
                    changes.blocks[block_key] = {
                        delete: true
                    }
                }
            }
        }
        return changes;
    }

    getWorkspacesChanges(local_workspace: ProjectFileDbWorkspace, server_workspace: ProjectFileDbWorkspace): ChangeWorkspaceDTO {
        const changes: ChangeWorkspaceDTO = {};
        if(local_workspace.title !== server_workspace.title) {
            changes.title = local_workspace.title;
        }
        if(local_workspace.name !== server_workspace.name) {
            changes.name = local_workspace.name;
        }
        if(local_workspace.index !== server_workspace.index) {
            changes.index = local_workspace.index;
        }
        if(local_workspace.parentId !== server_workspace.parentId) {
            changes.parentId = local_workspace.parentId ?? undefined;
        }
        const change_asset_props: AssetProps[] = diffAssetPropObjects(
                    assignPlainValueToAssetProps({}, local_workspace.props ?? {}),
                    assignPlainValueToAssetProps({}, server_workspace.props ?? {})
                )
        if(change_asset_props.length > 0){
            for(const change of change_asset_props){
                changes.props = {
                    ...changes.props,
                    ...change,
                }; 
            }
        }
        return changes;
    }
    
    async copyAssetToServer(localAssetId: string): Promise<AssetsFullResult> {
        const full = this.db.asset.assets.byId.get(localAssetId);
        if (!full) throw new Error('Asset not found');
        let blocks:
            | {
                [blockKey: string]: AssetBlockParamsDTO;
            }
            | undefined = undefined;
        for (const r of full.blocks) {
            const key = stringifyAssetNewBlockRef(null, r.id);
            if (!blocks) blocks = {};
            blocks[key] = {
                index: r.index,
                name: r.name,
                title: r.title,
                props: assignPlainValueToAssetProps({}, r.props),
                type: r.type,
            };
        }
        return await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/create`, {
            id: localAssetId,
            set: {
                icon: full.ownIcon ?? undefined,
                title: full.title,
                isAbstract: full.isAbstract,
                parentIds: full.parentIds,
                workspaceId: full.workspaceId ?? undefined,
                blocks,
            },
        });
    }

    private async _checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map: Map<string, SyncTableRow>, workspace_id: string){
        const db_workspace = need_sync_workspaces_map.get(workspace_id)
        if(!db_workspace) return;
        
        const local_workspace = this.db.workspace.workspaces.byId.get(db_workspace.id);
        if(local_workspace?.parentId) {
            await this._checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map, local_workspace.parentId)
        }
        else {
            const server_workspaces: ApiResultListWithTotal<Workspace> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
                where: {
                    ids: [db_workspace.id],
                }
            });
            const server_workspace = server_workspaces.list[0];
            if(server_workspace?.parentId){
                await this._checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map, server_workspace.parentId);
            }
        }
        await this._syncWorkspace(db_workspace);
        need_sync_workspaces_map.delete(db_workspace.id);
    }

    private async _syncWorkspace(db_workspace: SyncTableRow){
        let conflict: SyncConflict | null = null;
        let conflict_message: string | null = null;
        let server_state: Workspace | null = JSON.parse(db_workspace.server_state);
        try {
            const local_workspace = this.db.workspace.workspaces.byId.get(db_workspace.id);
            if(db_workspace.server_state) {
                if(local_workspace) {
                    const changes_from_local = this.getWorkspacesChanges(local_workspace, JSON.parse(db_workspace.server_state));
                    if(Object.keys(changes_from_local).length > 0) {              
                        if(db_workspace.server_deleted) {
                            conflict = SyncConflict.MODIFIED_DELETED;
                            return;
                        }
                        else {
                            const server_workspace_full: WorkspaceEntity = await this.db.api.call(Service.CREATORS, HttpMethods.PATCH, `workspaces`, {
                                where: {
                                    id: [db_workspace.id],
                                },
                                set: {
                                    ...changes_from_local,
                                }
                            });
                            if (!server_workspace_full){
                                conflict = SyncConflict.NO_ACCESS
                                return;
                            }
                            server_state = this.db.workspace.convertServerWorkspaceToLocal(server_workspace_full)
                        }
                    }       
                    else if(db_workspace.server_deleted) {
                        await this.db.workspace.workspacesDelete(db_workspace.id)
                    }
                    else {
                        const server_workspaces: ApiResultListWithTotal<Workspace> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
                            where: {
                                ids: [db_workspace.id],
                            }
                        });
                        const server_workspace = server_workspaces.list.find(w => w.id === db_workspace.id);
                        if(server_workspace){
                            server_state = this.db.workspace.convertServerWorkspaceToLocal(server_workspace as any)
                        }
                        else {
                            await this.db.dataSource.createQueryRunner().query(`
                                DELETE FROM workspaces
                                WHERE id = ?;
                            `, [db_workspace.id])
                        }
                    }
                }
                else {
                    await this.db.api.call(Service.CREATORS, HttpMethods.DELETE, `workspaces/delete/` + db_workspace.id, {});
                }
            }
            else {
                if(local_workspace) {
                    try {
                        // copy workspace to server
                        const server_workspace: ApiResultListWithTotal<Workspace> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
                            where: {
                                ids: [db_workspace.id],
                            }
                        });
                        server_state = this.db.workspace.convertServerWorkspaceToLocal(server_workspace as any);
                    }
                    catch(err: any){
                        if (err instanceof ApiError && err.code === ApiErrorCodes.ENTITY_ALREADY_EXISTS){
                            conflict = SyncConflict.DUPLICATE;
                            return;
                        }
                        else {
                            throw err;
                        }
                    }
                } else {
                    const server_workspaces: ApiResultListWithTotal<WorkspaceEntity> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
                        where: {
                            ids: [db_workspace.id],
                        }
                    });
                    if(server_workspaces.total > 0){
                        server_state = this.db.workspace.convertServerWorkspaceToLocal(server_workspaces.list[0])
                    }
                    else {
                        await this.db.dataSource.createQueryRunner().query(`
                            DELETE FROM workspaces
                            WHERE id = ?;
                        `, [db_workspace.id])
                    }
                }
            }

            if (server_state){
                if (!local_workspace){
                     await this.db.workspace.workspacesCreate({
                        ...(server_state),
                        id: db_workspace.id,
                        props: assignPlainValueToAssetProps({}, server_state.props),
                    });
                }
                else {
                    const changes_from_server = this.getWorkspacesChanges(local_workspace, JSON.parse(db_workspace.server_state))
                    if(Object.keys(changes_from_server).length > 0) {     
                        await this.db.workspace.workspacesCreate({
                            ...(server_state),
                            id: db_workspace.id,
                            props: assignPlainValueToAssetProps({}, server_state.props),
                        });
                    }
                }
            } 
        }
        catch(error: any) {
            if(error instanceof ApiError && error.code === ApiErrorCodes.ACCESS_DENIED){
                conflict = SyncConflict.NO_ACCESS
            }
            else {
                conflict = SyncConflict.ERROR;
            }
            conflict_message = error.message;
        }
        finally {
            await this.db.dataSource.createQueryRunner().query(`
                UPDATE workspaces
                SET synced_at = need_sync, conflict = ?, conflict_message = ?, server_state = ?
                WHERE id = ?;
            `, [conflict, conflict_message, server_state, db_workspace.id]);
        }
    }

    private async _syncWorkspaces(db_workspaces: SyncTableRow[]){
        const need_sync_workspaces_map = new Map(db_workspaces.map(w => [w.id, w]));
        for(const db_workspace of db_workspaces){
            await this._checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map, db_workspace.id);
        }
    }
}