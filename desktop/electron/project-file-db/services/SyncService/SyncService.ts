import { HttpMethods, Service } from "~ims-app-base/logic/managers/ApiWorker";
import type { AssetsFullResult, AssetBlockParamsDTO, AssetsChangeResult, AssetSetDTO } from "~ims-app-base/logic/types/AssetsType";
import type { ChangesStreamResponse, ChangesStreamRequest, ApiResultListWithTotal } from "~ims-app-base/logic/types/ProjectTypes";
import { stringifyAssetNewBlockRef, assignPlainValueToAssetProps, type AssetProps, diffAssetPropObjects } from "~ims-app-base/logic/types/Props";
import { type AssetPropWhere } from "~ims-app-base/logic/types/PropsWhere";
import type { Workspace, WorkspaceQueryDTOWhere } from "~ims-app-base/logic/types/Workspaces";
import log from 'electron-log/main';
import type { ChangeWorkspaceDTO } from "~ims-app-base/logic/types/RightsAndRoles";
import { syncEntity, type SyncTableRow } from "./sync-helpers";
import type { ProjectFileDb, ProjectFileDbAsset, ProjectFileDbWorkspace } from "../../ProjectFileDb";

const SYNC_CHUNK_SIZE = 50;
export const SQLITE_NOW_STM = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

export type WorkspaceEntity = {
    id: string;
    projectId: string;
    title: string;
    name: string | null;
    parentId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
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

    private async _syncAsset(db_asset: SyncTableRow){
        await syncEntity<ProjectFileDbAsset, AssetSetDTO>(db_asset, {
            db: this.db, 
            entityTable: 'assets',
            serverLoad: (id) => this._loadFromServerAsset(id),
            serverPut: async (id, change, create) => {
                const server_asset_full: AssetsFullResult = create ? 
                    await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/create`, {
                        id,
                        set: change
                    }) :  
                    await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/change`, {
                        where: {
                            id: [id],
                        },
                        set: change
                    });
                if (!server_asset_full.objects.assetFulls[id]){
                    return null;
                }
                return this.db.asset.convertServerAssetToLocal(
                    server_asset_full.objects.assetFulls[id]
                );
            },
            serverDelete: async (id) => {
                await this.db.api.call(Service.CREATORS, HttpMethods.POST, `assets/delete`, {
                    where: {
                        id: [id],
                    }
                });
            },
            localLoad: async (id) => await this.db.asset.assets.byId.get(id) ?? null,
            localPut: async (id, change, create) => {
                let res: AssetsFullResult;
                if (create){
                    res = await this.db.asset.assetsCreate({
                        id: id,
                        set: change
                    });
                }
                else {  
                    res = await this.db.asset.assetsChange({
                        where: {
                            id
                        },
                        set: change
                    });
                }
            },
            localDelete: async (id) => {
                await this.db.asset.assetsDelete({
                    id: [id],
                })
            },
            getChanges: (source, target) => this.getAssetsChanges(source, target),
        })
    }

    private async _syncAssets(db_assets: SyncTableRow[]){
        for(const db_asset of db_assets){
            await this._syncAsset(db_asset);
        }
    }

    private async _syncWorkspace(db_workspace: SyncTableRow){
        await syncEntity<ProjectFileDbWorkspace, ChangeWorkspaceDTO>(db_workspace, {
            db: this.db, 
            entityTable: 'workspaces',
            serverLoad: (id) => this._loadFromServerWorkspace(id),
            serverPut: async (id, change, create) => {
                const server_workspace_full: WorkspaceEntity =  create ? 
                    await this.db.api.call(Service.CREATORS, HttpMethods.POST, `workspaces`, {
                        id,
                        ...change
                    }) : 
                    await this.db.api.call(Service.CREATORS, HttpMethods.PATCH, `workspaces/${id}`, change);
                if (!server_workspace_full){
                    return null;
                }
                return this.db.workspace.convertServerWorkspaceToLocal(server_workspace_full)
            },
            serverDelete: async (id) => {
                await this.db.api.call(Service.CREATORS, HttpMethods.DELETE, `workspaces/${id}`);
            },
            localLoad: async (id) => this.db.workspace.workspaces.byId.get(id) ?? null,
            localPut: async (id, change, create) => {
                if (create){
                    await this.db.workspace.workspacesCreate({
                        ...change,
                        id,
                        props: assignPlainValueToAssetProps({}, change.props ?? {}),
                    });
                }
                else {  
                    await this.db.workspace.workspacesChange(id, change);
                }
            },
            localDelete: async (id) => {
                await this.db.workspace.workspacesDelete(id)
            },
            getChanges: (source, target) => this.getWorkspacesChanges(source, target),
        });
    }

    private async _syncWorkspaces(db_workspaces: SyncTableRow[]){
        const need_sync_workspaces_map = new Map(db_workspaces.map(w => [w.id, w]));
        for(const db_workspace of db_workspaces){
            await this._checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map, db_workspace.id);
        }
    }

    
    private async _loadFromServerAsset(db_asset_id: string): Promise<ProjectFileDbAsset | null>{
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

    private async _loadFromServerWorkspace(db_workspace_id: string): Promise<ProjectFileDbWorkspace | null>{
        const server_workspaces: ApiResultListWithTotal<Workspace> = await this.db.api.call(Service.CREATORS, HttpMethods.GET, `workspaces`, {
            where: JSON.stringify({
                ids: [db_workspace_id],
            })
        });
        const server_workspace = server_workspaces.list[0]
        if(server_workspace){
            return this.db.workspace.convertServerWorkspaceToLocal(server_workspace as any)
        }
        else {
            return null;
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
            source_asset.parentIds.some((val: any, ind: number) => target_asset.parentIds[ind] !== val)
        ) {
            changes.parentIds = source_asset.parentIds;
        }
        if(!target_asset || source_asset.workspaceId !== target_asset.workspaceId) {
            changes.workspaceId = source_asset.workspaceId;
        }

        for(const source_block of source_asset.blocks){
            const target_block = target_asset ? target_asset.blocks.find((x: { id: any; }) => x.id === source_block.id) : null;
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
                const local_block = source_asset.blocks.find((x: { id: any; }) => x.id === server_block.id);
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

    getWorkspacesChanges(source_workspace: ProjectFileDbWorkspace, target_workspace: ProjectFileDbWorkspace | null): ChangeWorkspaceDTO {
        const changes: ChangeWorkspaceDTO = {};
        if(!target_workspace || source_workspace.title !== target_workspace.title) {
            changes.title = source_workspace.title;
        }
        if(!target_workspace || source_workspace.name !== target_workspace.name) {
            changes.name = source_workspace.name;
        }
        if(!target_workspace || source_workspace.index !== target_workspace.index) {
            changes.index = source_workspace.index;
        }
        if(!target_workspace || source_workspace.parentId !== target_workspace.parentId) {
            changes.parentId = source_workspace.parentId ?? undefined;
        }
        const source_props = assignPlainValueToAssetProps({}, source_workspace.props ?? {})
        const change_props: AssetProps[] = target_workspace ? diffAssetPropObjects(
                    source_props,
                    assignPlainValueToAssetProps({}, target_workspace.props ?? {}) 
                ) :
                    [source_props]
        if(change_props.length > 0){
            changes.props = source_props
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
                where: JSON.stringify({
                    ids: [db_workspace.id],
                })
            });
            const server_workspace = server_workspaces.list[0];
            if(server_workspace?.parentId){
                await this._checkParentWorkspaceNeedSyncAndSync(need_sync_workspaces_map, server_workspace.parentId);
            }
        }
        await this._syncWorkspace(db_workspace);
        need_sync_workspaces_map.delete(db_workspace.id);
    }
}