import type { ProjectFileDb, ProjectFileDbAsset, ProjectFileDbWorkspace } from "../ProjectFileDb";
import fs from 'node:fs';
import * as node_path from 'path';
import { AssetRights } from '~ims-app-base/logic/types/Rights';
import { v4 as uuidv4 } from 'uuid';
import { absolutePathToUuid } from "../utils/files";
import { MARKDOWN_ASSET_ID, BLOCK_NAME_META } from "~ims-app-base/logic/constants";
   
export class FileSystemService{

    constructor(public db: ProjectFileDb){

    }

    private async _loadFiles(items: fs.Dirent[], path: string, workspace_id: string, root_path: string): Promise<{
        assets: Map<string, ProjectFileDbAsset>,
        workspaces: Map<string, ProjectFileDbWorkspace>,
    }>{
        const assets = new Map<string, ProjectFileDbAsset>();
        const workspaces = new Map<string, ProjectFileDbWorkspace>();
        for (const item of items) {
            if (item.name.startsWith('.')){
                continue;
            }
            if (item.isFile()){
                try {
                    const extname = node_path.extname(item.name);
                    if (extname !== '.json' && extname !== '.md'){
                        continue;
                    }
                
                    const local_name = item.name;
                    const local_path = node_path.join(path, local_name);
                    const file_info = await fs.promises.stat(local_path);
                    const created_at = file_info.birthtime.toISOString();
                    const updated_at = file_info.mtime.toISOString();

                    const file = await fs.promises.readFile(local_path, { encoding: 'utf8' });
                    if (extname === '.json') {
                        if (/\.ima[ \d\(\)\[\]_]*\.json$/i.test(item.name)) {
                            const asset = JSON.parse(file) as ProjectFileDbAsset;
                            asset.localName = local_name
                            asset.workspaceId = workspace_id;
                            asset.createdAt = created_at;
                            asset.updatedAt = updated_at;
                            assets.set(asset.localName, asset);
                        }
                        else if (/\.imw[ \d\(\)\[\]_]*\.json$/i.test(item.name)){
                            const workspace_info = JSON.parse(file) as ProjectFileDbWorkspace;
                            workspace_info.localName = local_name
                            workspace_info.parentId = workspace_id;
                            workspace_info.createdAt = created_at;
                            workspace_info.updatedAt = updated_at;
                            workspaces.set(workspace_info.localName, workspace_info);
                        }
                    }
                    else if(extname === '.md'){
                        const asset_full: ProjectFileDbAsset = {
                            id: absolutePathToUuid(local_path, root_path),
                            projectId: this.db.project.db.info.id ?? '',
                            workspaceId: workspace_id,
                            name: null,
                            title: node_path.basename(item.name, node_path.extname(item.name)),
                            icon: 'markdown-fill',
                            isAbstract: false,
                            typeIds: [MARKDOWN_ASSET_ID],
                            createdAt: created_at,
                            updatedAt: updated_at,
                            deletedAt: null,
                            rights: AssetRights.FULL_ACCESS,
                            index: null,
                            creatorUserId: null,
                            unread: 0,
                            hasImage: false,
                            parentIds: [MARKDOWN_ASSET_ID],
                            ownTitle: null,
                            ownIcon: 'markdown-fill',
                            blocks: [{
                                id: uuidv4(),
                                type: 'props',
                                name: BLOCK_NAME_META,
                                title: null,
                                index: 0,
                                createdAt: created_at,
                                updatedAt: updated_at,
                                ownTitle: null,
                                own: true,
                                props: {
                                    format: 'md',
                                },
                                computed: {
                                    format: 'md',
                                },
                                inherited: {},
                            },
                            {
                                id: uuidv4(),
                                type: 'markdown',
                                name: null,
                                title: null,
                                index: 1,
                                createdAt: created_at,
                                updatedAt: updated_at,
                                ownTitle: null,
                                own: true,
                                props: {
                                    value: file,
                                },
                                computed: {
                                    value: file,
                                },
                                inherited: {},
                            }],
                            comments: [],
                            references: [],
                            lastViewedAt: null,
                            localName: local_name,
                        };
                        assets.set(local_name, asset_full);
                    }
                }
                catch(err) {
                    console.log('failed to read', item.name, err);
                }
            }
        }
        return {
            assets,
            workspaces
        }
    }

    async loadWorkspace(path: string, workspace_id: string, root_path: string): Promise<{
        assets: ProjectFileDbAsset[],
        workspaces: ProjectFileDbWorkspace[],
    }>{
        const items = await fs.promises.readdir(path, {
            withFileTypes: true,
        });
        const { assets, workspaces } = await this._loadFiles(items, path, workspace_id, root_path);
        const res_assets = [...assets.values()]
        const res_workspaces = [...workspaces.values()]
        for (const item of items) {
            if (item.isDirectory()) {
                if (root_path === path && (item.name.startsWith('.') || item.name === 'attachments')){
                    continue; // Ignore service folders
                }
                const local_name = item.name + ".imw.json";
                const folder = node_path.join(path, item.name);
                let workspace: ProjectFileDbWorkspace | undefined = workspaces.get(local_name);
                if(!workspace){
                    const file_info = await fs.promises.stat(folder);
                    const created_at = file_info.birthtime.toISOString();
                    const updated_at = file_info.mtime.toISOString();
                    workspace = {
                        id: absolutePathToUuid(folder, root_path),
                        title: item.name,
                        name: null,
                        parentId: workspace_id,
                        projectId: this.db.project.db.info.id ?? '',
                        createdAt: created_at,
                        updatedAt: updated_at,
                        rights: AssetRights.FULL_ACCESS,
                        index: null,
                        props: {},
                        localName: local_name,
                    }
                    res_workspaces.push(workspace)
                }
                const res = await this.loadWorkspace(folder, workspace.id, root_path);
                res_assets.push(...res.assets);
                res_workspaces.push(...res.workspaces);
            }
        }
        return {
            assets: res_assets,
            workspaces: res_workspaces,
        }
    }
}
