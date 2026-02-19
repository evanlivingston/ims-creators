import type { AssetReferenceEntity, AssetShort } from "~ims-app-base/logic/types/AssetsType";
import type { Workspace } from "~ims-app-base/logic/types/Workspaces";
import { FileSystemService } from "./services/FileSystemService";
import { AssetService } from "./services/AssetService";
import { WorkspaceService } from "./services/WorkspaceService";
import { ProjectService } from "./services/ProjectService";
import { assert } from "~ims-app-base/logic/utils/typeUtils";
import fs from 'node:fs';
import path from 'node:path';
import type { AssetPropsPlainObject } from "~ims-app-base/logic/types/Props";
import type { AssetCommentDTO } from "~ims-app-base/logic/types/CommentTypes";
import { ApiService } from "./services/ApiService";
import { getMainTokenStorage } from "../main-token-storage";
import { PROJECT_META_FOLDER, PROJECT_META_INDEX } from "./project-db-constants";
import { AssetRights } from "~ims-app-base/logic/types/Rights";

export type ProjectFileDbAssetBlock = {
    id: string;
    type: string;
    name: string | null;
    title: string | null;
    index: number;
    createdAt: string;
    updatedAt: string;
    ownTitle: string | null;
    own: boolean;
    props: AssetPropsPlainObject,
    computed: AssetPropsPlainObject,
    inherited: AssetPropsPlainObject | null,
    delete?: true,
}

export type ProjectFileDbAsset = AssetShort & {
    localPath?: string;    
    typeIds: string[];   
    parentIds: string[];
    ownTitle: string | null;
    ownIcon: string | null;
    blocks: ProjectFileDbAssetBlock[]
    comments: AssetCommentDTO[];
    references: AssetReferenceEntity[];
    lastViewedAt?: string | null;
};
export type ProjectFileDbWorkspace = Workspace & {
    localName?: string;
};

const RootGddFolder: ProjectFileDbWorkspace = {
    "id": "00000000-0000-0000-0000-200000000002",
    "index": null,
    "title": "[[t:Gdd]]",
    "name": "gdd",
    "parentId": null,
    "projectId": '',
    "props": {},
    createdAt: "",
    updatedAt: "",
    rights: AssetRights.WRITE_VALUES,
    unread: 0
}

export type ProjectFileDbInfo = {
    id: string;
    title: string;   
    inited: boolean
}

export class ProjectFileDb  {
    private _info: ProjectFileDbInfo | null = null;
    private _initing: Promise<void> | null = null;
    private _destroying: Promise<void> | null = null;

    public fileSystem = new FileSystemService(this)
    public asset = new AssetService(this)
    public workspace = new WorkspaceService(this);
    public project = new ProjectService(this);
    public api = new ApiService(this)

    public RootGddFolder =  {...RootGddFolder}

    constructor(public localPath: string){

    }

    get isDestroying(){
        return !!this._destroying;
    }

    private async _initImpl(initParams?: { title: string, id: string | null}){
        await fs.promises.mkdir(path.join(this.localPath, PROJECT_META_FOLDER), {
          recursive: true
        });

        try {
          const projectInfoText = await fs.promises.readFile(path.join(this.localPath, PROJECT_META_INDEX), 'utf-8')
          const projectInfo = JSON.parse(projectInfoText);
          this._info = {
              id: projectInfo.id ?? '',
              title:projectInfo.title,
              inited: projectInfo.inited
          }
        } catch (err: any) {
          if (!/^ENOENT:/.test(err.message)){
            throw err;
          }

          const title = initParams?.title ?? this.localPath.split(/[\\/]/).pop() ?? '';
          this._info = {
            id: initParams?.id ?? '',
            title,
            inited: true
          }
          await fs.promises.writeFile(path.join(this.localPath, PROJECT_META_INDEX), JSON.stringify(this._info), 'utf-8')
        }

        this.api.init(getMainTokenStorage())
        if (this._info.id){
            this.api.setCurrentProjectId(this._info.id);
        }

        await this.fileSystem.init()
    }

    init(initParams?: { title: string, id: string | null}){
        if (this.isDestroying){
            throw new Error('Cannot init destroying ProjectFileDb');
        }
        if (!this._initing){
            this._initing = this._initImpl(initParams).catch(err => {
                this._initing = null;
                throw err;
            })
        }
        return this._initing;
    }      


    private async _destroyImpl(){
        if (!this._info){
            return;
        }
        await this.fileSystem.destroy();
        this._info = null;
    }

    async destroy(){
        if (!this._destroying){
            this._destroying = this._destroyImpl().catch(err => {
                this._destroying = null;
                throw err;
            })
        }
        return this._destroying;
    }

    get info(){
        assert(this._info, 'ProjectFileDb is not inited');
        return this._info;
    }


    export(workpsaceId: string, targetPath: string){
        
    }


}