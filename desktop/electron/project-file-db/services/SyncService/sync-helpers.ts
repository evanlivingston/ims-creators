import ApiError, { ApiErrorCodes } from "~ims-app-base/logic/types/ApiError";
import type { ProjectFileDb } from "../../ProjectFileDb";

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

export type SyncEntityOptions<T, C extends Record<string, any>> = {
    db: ProjectFileDb, 
    entityTable: string,
    serverLoad: (id: string) => Promise<T | null>,
    serverPut: (id: string, change: C, create: boolean) => Promise<T | null>,
    serverDelete: (id: string) => Promise<void>,
    localLoad: (id: string) => Promise<T | null>,
    localPut: (id: string, change: C, create: boolean) => Promise<void>,
    localDelete: (id: string) => Promise<void>,
    getChanges: (source: T, target: T | null) => C
}

export async function syncEntity<T, C extends Record<string, any>>(entity: SyncTableRow, options: SyncEntityOptions<T, C>){
    let conflict: SyncConflict | null = null;
    let conflict_message: string | null = null;
    let old_server_state: T | null = entity.server_state ? JSON.parse(entity.server_state) : null;
    let new_server_state: T | null;
    let local_state: T | null | undefined = undefined
    try {

        const was_synced_before = !!old_server_state
        if (
            !entity.server_deleted && 
            !old_server_state
        ){
            old_server_state = await options.serverLoad(entity.id);
        }

        local_state = await options.localLoad(entity.id) ?? null

        if(old_server_state) {
            if(local_state) {
                const changes_from_local = options.getChanges(local_state, old_server_state)
                const has_local_changes = Object.keys(changes_from_local).length > 0
    
                if(entity.server_deleted) {
                    new_server_state = null
                    if (has_local_changes){
                        conflict = SyncConflict.MODIFIED_DELETED;
                        return;
                    }
                    else {
                        await options.localDelete(entity.id)
                    }
                }
                else if (has_local_changes){
                    new_server_state = await options.serverPut(entity.id, changes_from_local, false);
                    if (!new_server_state){
                        conflict = SyncConflict.NO_ACCESS
                        return;
                    }
                }
                else {
                    new_server_state = !entity.server_state ? old_server_state : await options.serverLoad(entity.id);
                    if(!new_server_state) {
                        conflict = SyncConflict.NO_ACCESS
                        return;
                    }
                }
            }
            else if (was_synced_before) {
                // => Deleted locally, but was synced before
                await options.serverDelete(entity.id);
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
                    const save_changes = options.getChanges(local_state, null)
                    new_server_state = await options.serverPut(entity.id,save_changes, true);
                    if (!new_server_state){
                        conflict = SyncConflict.NO_ACCESS
                        return;
                    }
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
            const changes_from_server = options.getChanges(new_server_state, local_state)
            if(Object.keys(changes_from_server).length > 0) {     
                await options.localPut(entity.id, changes_from_server, !local_state)         
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
            await options.db.dataSource.createQueryRunner().query(`
                DELETE FROM ${options.entityTable}
                WHERE id = ?;
            `, [entity.id])
        }
        else {
            await options.db.dataSource.createQueryRunner().query(`
                UPDATE ${options.entityTable}
                SET synced_at = need_sync, conflict = ?, conflict_message = ?, server_state = ?
                WHERE id = ?;
            `, [conflict, conflict_message, JSON.stringify(save_server_state), entity.id]);
        }
    }
}