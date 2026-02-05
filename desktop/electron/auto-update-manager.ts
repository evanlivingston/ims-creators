import electronUpdater, { CancellationToken, type UpdateInfo } from "electron-updater";
import { version as appVersion } from "../package.json"
import { BrowserWindow } from "electron"
import log from 'electron-log/main';

const autoUpdater = electronUpdater.autoUpdater;
autoUpdater.allowDowngrade = true;
autoUpdater.autoDownload = false;
autoUpdater.logger = log;

export type AutoUpdateManagerStatus =  {
    error: null; 
    cancelled: boolean; 
    downloadingDone: boolean;
    downloadingPercent: number;
    newVersion: boolean;
};

class AutoUpdateManager {
    private _status: AutoUpdateManagerStatus;
    private _newVersionAvailable: UpdateInfo | null = null;
    private _cancellationToken: CancellationToken | null = null;

    constructor(){
        this._status = {
            error: null,
            cancelled: false,
            downloadingDone: false,
            downloadingPercent: 0,
            newVersion: false,
        }
        this._newVersionAvailable = null;
        this._cancellationToken = null;
        autoUpdater.on('error', (err: any) => {
            this._status.error = err;
            console.error(err)
        })
        autoUpdater.on('update-cancelled', (ev: any) => {
            this._status.cancelled = true;
        })
        autoUpdater.on('download-progress', (ev: any) => {
            this._status.downloadingPercent = ev.percent;
        })
        autoUpdater.on('update-downloaded', (ev: any) => {
            this._status.downloadingDone = true;
        });
    }

    async checkNewVersion(){
        try{
            const  res = await autoUpdater.checkForUpdates();

           if (res && res.updateInfo && res.updateInfo.version !== appVersion){
                this._status.newVersion = true;
                this.setNewVersionAvailable(res.updateInfo);
            }
        }
        catch(err){
            console.error('Auto-update', err);
        }
    }

    async quitAndInstall(){
        autoUpdater.quitAndInstall();
    }

    setNewVersionAvailable(version: any){
        this._newVersionAvailable = version;
        
        const allWindows = BrowserWindow.getAllWindows();
        for (const window of allWindows){
            window.webContents.send("new-version-available", version);
        }
    }

    getNewVersionAvailable(){
        return this._newVersionAvailable
    }

    getStatus(){
        return this._status;
    }

    async downloadUpdate(){
        this._cancellationToken = new CancellationToken();
        this._status.error = null;
        this._status.downloadingPercent = 0;
        this._status.cancelled = false;
        await autoUpdater.downloadUpdate(this._cancellationToken);
    }

    cancelUpdate(){
        if (this._cancellationToken){
            this._cancellationToken.cancel();
        }
    }

    async quitAndInstallUpdate(){
        await autoUpdater.quitAndInstall();
    }
}

export default new AutoUpdateManager();
