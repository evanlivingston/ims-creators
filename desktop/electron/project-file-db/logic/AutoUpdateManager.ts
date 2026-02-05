import updater from "electron-updater";
const { autoUpdater, CancellationToken } = updater;
autoUpdater.allowDowngrade = true;
autoUpdater.autoDownload = false;

class AutoUpdateManager {
    _status: { error: null; cancelled: boolean; downloadingDone: boolean; downloadingPercent: number; newVersion: boolean; };
    _newVersionAvailable: any = null;
    _cancellationToken: any = null;

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
            // log.info('Start check update');
            let res = await autoUpdater.checkForUpdates();

            //res = {"versionInfo":{"version":"1.5.0","files":[{"url":"ImsStudio Setup 1.5.0.exe","sha512":"oM0gs6Qe3+1/aAs4t9qhtOalgXWLb9Ia35WefhJQJqn9MY0PyK//qewzlWOLTK93sDwCYGD2eOk93v0HAez2dg==","size":107848464}],"path":"ImsStudio Setup 1.5.0.exe","sha512":"oM0gs6Qe3+1/aAs4t9qhtOalgXWLb9Ia35WefhJQJqn9MY0PyK//qewzlWOLTK93sDwCYGD2eOk93v0HAez2dg==","releaseDate":"2022-03-17T19:55:28.051Z"},
            //    "updateInfo":{"version":"1.5.0","files":[{"url":"ImsStudio Setup 1.5.0.exe","sha512":"oM0gs6Qe3+1/aAs4t9qhtOalgXWLb9Ia35WefhJQJqn9MY0PyK//qewzlWOLTK93sDwCYGD2eOk93v0HAez2dg==","size":107848464}],"path":"ImsStudio Setup 1.5.0.exe","sha512":"oM0gs6Qe3+1/aAs4t9qhtOalgXWLb9Ia35WefhJQJqn9MY0PyK//qewzlWOLTK93sDwCYGD2eOk93v0HAez2dg==","releaseDate":"2022-03-17T19:55:28.051Z"},"cancellationToken":{"_events":{},"_eventsCount":0,"_maxListeners":100,"parentCancelHandler":null,"_parent":null,"_cancelled":false},"downloadPromise":{}}
            if (res && res.updateInfo && res.updateInfo.version !== process.env.IMS_STUDIO_VERSION){
                this._status.newVersion = true;
                this.setNewVersionAvailable(res.updateInfo);
            }
            // log.info('Stop check update');
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
        /*if (global.currentWindow) {
            // TODO check this
            global.currentWindow.webContents.send("new-version-available", version);
        }*/
    }

    getNewVersionAvailable(){
        return this._newVersionAvailable
    }

    getStatus(){
        return {...this._status};
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
            this._cancellationToken.cancel
        }
    }

    async quitAndInstallUpdate(){
        await autoUpdater.quitAndInstall();
    }

    exitApplication(){
        //TODO
    }
}

export default new AutoUpdateManager();
