import type { AssetReferenceEntity, AssetShort } from "~ims-app-base/logic/types/AssetsType";
import type { Workspace } from "~ims-app-base/logic/types/Workspaces";
import { FileSystemService } from "./services/FileSystemService";
import { AssetService } from "./services/AssetService";
import { WorkspaceService } from "./services/WorkspaceService";
import { ProjectService } from "./services/ProjectService";
import SystemBundle from "./system-assets-bundle.json"
import { assert } from "~ims-app-base/logic/utils/typeUtils";
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_META_FOLDER, PROJECT_META_INDEX } from '../project-db/project-constants';
import { AssetRights } from "~ims-app-base/logic/types/Rights";
import type { AssetPropsPlainObject } from "~ims-app-base/logic/types/Props";
import type { AssetCommentDTO } from "~ims-app-base/logic/types/CommentTypes";

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

export const ASSET_BASE_ORDERING = [
  'index',
  'title',
  'name',
  'createdAt',
  'id',
];

export type ProjectFileDbInfo = {
    id: string;
    title: string;   
    inited: boolean
}

export class ProjectFileDb  {
    private _info: ProjectFileDbInfo | null = null;

    public fileSystem = new FileSystemService(this)
    public asset = new AssetService(this)
    public workspace = new WorkspaceService(this);
    public project = new ProjectService(this);
    
    public RootGddFolder =  {...RootGddFolder}

    constructor(public localPath: string){

    }

    async init(initParams?: { title: string, id: string | null}){
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

        this.asset.assets.clear();
        this.asset.systemAssets.clear();
        this.workspace.workspaces.clear();

        // System
        this.asset.systemAssets.addMany((SystemBundle.assets as unknown as ProjectFileDbAsset[]).map(asset => {
            return {...asset, rights: 1}
        }))
        this.asset.assets.addMany((SystemBundle.assets as unknown as ProjectFileDbAsset[]).map(asset => {
            return {...asset, rights: 1}
        }));
        this.workspace.workspaces.addMany((SystemBundle.workspaces as unknown as ProjectFileDbWorkspace[]).map(workspace => {
            return {...workspace, rights: 1}
        }));

        // User
        const user_files = await this.fileSystem.loadWorkspace(this.localPath, this.RootGddFolder.id, this.localPath);
        if (this.info.id){
            this.RootGddFolder.projectId = this.info.id;
        }
        this.RootGddFolder.localName ='';
        this.asset.assets.addMany(user_files.assets.map(asset => {
            const changed_asset: ProjectFileDbAsset = { 
                ...asset,
                projectId: this.info.id,
                rights: 5
            }
            if (!changed_asset.workspaceId){
                changed_asset.workspaceId = this.RootGddFolder.id;
            }
            return changed_asset
        }));
        this.workspace.workspaces.add(this.RootGddFolder)
        this.workspace.workspaces.addMany(user_files.workspaces.map(workspace => {
            const changed_workspace =  {
                ...workspace, 
                projectId: this.info.id,
                rights: 5
            }
            if (!changed_workspace.parentId){
                changed_workspace.parentId = this.RootGddFolder.id;
            }
            return changed_workspace
        }));
       
    }      

    async destroy(){

    }

    get info(){
        assert(this._info, 'ProjectFileDb is not inited');
        return this._info;
    }


    export(workpsaceId: string, targetPath: string){
        
    }


}