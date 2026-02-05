import ProjectManager from "~ims-app-base/logic/managers/ProjectManager"
import type { AssetShort } from '~ims-app-base/logic/types/AssetsType';
import type { LocalProjectInitInfo } from "#bridge/api/ImsHostProject";
import type { Workspace } from '~ims-app-base/logic/types/Workspaces';
import { convertTranslatedTitle } from "~ims-app-base/logic/utils/assets";

export const availableFilenameRegexp = new RegExp("[^- А-Яа-яa-zA-Z,@.;'`!)(]+", 'g');
function prepareFileBasenameByEntityTitle(title: string){
  return title.replace(availableFilenameRegexp, '_').trim()
}

export default class DesktopProjectManager extends ProjectManager{
    private _projectLocalPath: string | null = null;

    async initializeLocalProject(localPath: string, initParams?: { title: string, id: string | null}): Promise<LocalProjectInitInfo> {
        const res = await window.imshost.project.initProject(localPath, initParams);
        this._projectLocalPath = localPath;
        return res;
    }

    async connectLocalProject(localProject: LocalProjectInitInfo, pid: string){

    }
    
    override getAllowAnonymUsers() {
        return true;
    }

    override async exportAsset(asset: AssetShort, params?: Record<string, any>) {
        if (!this._projectLocalPath){
            throw new Error('Project is not inited')
        }
        const file_title = `${prepareFileBasenameByEntityTitle(
            convertTranslatedTitle(asset.title ?? 'untitled',(...args) => this.appManager.$t(...args))
        )}.ima.json`
        const save_dialog_res = await window.imshost.fs.showSaveFileDialog({
            defaultPath: file_title
        })
        if (save_dialog_res.canceled){
            return;
        }
    
        await window.imshost.project.exportAssetToFile(
                this._projectLocalPath,
                asset.id,
                save_dialog_res.filePath)
    }

    override async exportWorkspace(workspace: Workspace, params?: Record<string, any>): Promise<void> {
        if (!this._projectLocalPath){
            throw new Error('Project is not inited')
        }
        const file_title = `${prepareFileBasenameByEntityTitle(
            convertTranslatedTitle(workspace.title ?? 'untitled',(...args) => this.appManager.$t(...args))
        )}.zip`
        const save_dialog_res = await window.imshost.fs.showSaveFileDialog({
            defaultPath: file_title
        })
    
        if (save_dialog_res.canceled){
            return;
        }
        await window.imshost.project.exportWorkspaceToFile(
                this._projectLocalPath,
                workspace.id,
                save_dialog_res.filePath)
    }
    async importTemplateProject(template_id: string){
        if (!this._projectLocalPath){
            throw new Error('Project is not inited')
        }
        await window.imshost.project.importTemplateProject(this._projectLocalPath,template_id);
    }
}