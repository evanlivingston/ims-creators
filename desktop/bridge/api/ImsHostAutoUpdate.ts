import { ImsHostBase } from "./ImsHostBase";
import AutoUpdateManager from "../../electron/auto-update-manager";
import type { UpdateNewVersion } from "#logic/types/AutoUpdateTypes";

export class ImsHostAutoUpdate extends ImsHostBase{
    async autoUpdateGetStatus(){
        return AutoUpdateManager.getStatus();
    }

    async getNewVersionAvailable(): Promise<UpdateNewVersion | null> {
        return AutoUpdateManager.getNewVersionAvailable();
    }
        
    async downloadUpdate(){
        return AutoUpdateManager.downloadUpdate()
    }

    async cancelUpdate(){
        return AutoUpdateManager.cancelUpdate()
    }

    async quitAndInstallUpdate(){
        return AutoUpdateManager.quitAndInstallUpdate()
    }

}
