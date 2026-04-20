import type { SyncInfo } from "#logic/types/SyncTypes";
import { AppSubManagerBase } from "~ims-app-base/logic/managers/IAppManager";
import ProjectManager from "~ims-app-base/logic/managers/ProjectManager";

export default class DesktopSyncManager extends AppSubManagerBase {
    private _synchronizationTimer: NodeJS.Timeout | undefined;
    private _syncInfo: SyncInfo | undefined;

    init(){
        this._synchronizationTimer = setInterval(async () => {
            await this.loadSyncStatus();
        }, 10 * 1000);
    }

    destroy(){
        if(this._synchronizationTimer){
           clearInterval(this._synchronizationTimer); 
           this._synchronizationTimer = undefined
        }
    }

    getSyncStatus(): SyncInfo | undefined {
        return this._syncInfo ? {...this._syncInfo} : undefined;
    }


    async loadSyncStatus(){
        const local_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath; 
        if(local_path){
            this._syncInfo = await window.imshost.sync.getSyncStatus(local_path);
        }
    }

    async runSync(){
        const local_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath; 
        if(local_path){
            await window.imshost.sync.syncProject(local_path);
        }
    }

    async pauseSyncProject(){
        const local_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath; 
        if(local_path){
            await window.imshost.sync.pauseSyncProject(local_path);
        }
    }

    async resumeSyncProject(){
        const local_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath; 
        if(local_path){
            await window.imshost.sync.resumeSyncProject(local_path);
        }
    }

    async resyncAssetsAndWorkspaces(asset_ids: string[], workspace_ids: string[]){
        const local_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath; 
        if(local_path){
            await window.imshost.sync.resyncAssetsAndWorkspaces(local_path, asset_ids,workspace_ids);
        }
    }
}