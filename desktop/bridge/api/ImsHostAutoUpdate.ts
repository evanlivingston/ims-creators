import { ImsHostBase } from "./ImsHostBase";
import AutoUpdateManager from "../../electron/project-file-db/logic/AutoUpdateManager";

export class ImsHostAutoUpdate extends ImsHostBase{
    autoUpdateGetStatus(){
        return AutoUpdateManager.getStatus();
    }

    getNewVersionAvailable(){
        return AutoUpdateManager.getNewVersionAvailable();
    }
        
    downloadUpdate(){
        return AutoUpdateManager.downloadUpdate()
    }

    cancelUpdate(){
        return AutoUpdateManager.cancelUpdate()
    }

    quitAndInstallUpdate(){
        return AutoUpdateManager.quitAndInstallUpdate()
    }

    exitApplication(){
        return AutoUpdateManager.exitApplication()
    }
}
