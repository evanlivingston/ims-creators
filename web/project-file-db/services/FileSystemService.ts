import type { ProjectFileDb, ProjectFileDbAsset, ProjectFileDbAssetBlock, ProjectFileDbWorkspace } from "../ProjectFileDb";
import fs from 'node:fs';
import * as node_path from 'path';
import { AssetRights } from '~ims-app-base/logic/types/Rights';
import { v4 as uuidv4 } from 'uuid';
import { absolutePathToUuid } from "../utils/files";
import { MARKDOWN_ASSET_ID, BLOCK_NAME_META } from "~ims-app-base/logic/constants";

/**
 * Map of workspace directory name (lowercase) -> Type asset id.
 * Flat-loaded data files inherit the matching Type so asset pickers
 * filtered by `typeids` (e.g. cross-conversation jump dropdown) include
 * them. Without this, flat assets show typeIds: [] and are filtered out
 * everywhere except recently-used.
 *
 * IDs match the corresponding `design/Types/<name>.ima.json` files.
 */
const FLAT_DIR_TO_TYPE_ID: Record<string, string> = {
    'dialogues':       'a9afe517-a79f-4753-9e34-3a39fde65766',
    // Other flat-loaded directories can be added here as needed; absence
    // just means assets in that directory keep typeIds: [] (current behaviour).
};

/**
 * Load JSON Schema files from design/schemas/ and build a map of
 * workspace directory name (lowercase) -> __props metadata.
 * This replaces the need for Types/*.ima.json for property editor rendering.
 */
function loadSchemaPropsMap(rootPath: string): Map<string, Record<string, any>> {
    const result = new Map<string, Record<string, any>>();
    const schemasDir = node_path.join(rootPath, 'schemas');
    if (!fs.existsSync(schemasDir)) return result;

    for (const file of fs.readdirSync(schemasDir)) {
        if (!file.endsWith('.schema.json')) continue;
        try {
            const schema = JSON.parse(fs.readFileSync(node_path.join(schemasDir, file), 'utf8'));
            const typeName = (schema.title || '').toLowerCase();
            if (!typeName) continue;

            const __props: Record<string, any> = {};
            let index = 1;
            for (const [key, prop] of Object.entries(schema.properties || {} as Record<string, any>)) {
                if (key === 'title' || key === 'description' || key === 'script') continue;
                const p = prop as any;
                const entry: Record<string, any> = { index: index++, title: p.title || key };
                if (p.description) entry.hint = p.description;

                if (p['x-references']) {
                    entry.type = 'gddElementSelector';
                    entry.params = { type: { Title: p['x-references'] } };
                    if (p.type === 'array') entry.multiple = true;
                } else if (p.enum) {
                    entry.type = 'enum';
                } else if (p.type === 'boolean') {
                    // IMS uses 'checkbox' for booleans; JSON Schema uses 'boolean'.
                    entry.type = 'checkbox';
                } else {
                    entry.type = p.type || 'string';
                }

                __props[key] = entry;
            }

            // Map plural workspace names to this schema
            // "item" -> Items, Abilities -> "ability", etc.
            const plurals = [
                typeName + 's',
                typeName + 'es',
                typeName.replace(/y$/, 'ies'),
                typeName.replace(/ /g, ''),
                typeName.replace(/ /g, '') + 's',
                typeName.replace(/ /g, '') + 'es',
            ];
            for (const pl of plurals) {
                result.set(pl, __props);
            }
            result.set(typeName, __props);
        } catch { /* skip */ }
    }
    return result;
}
   
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
                            // Ensure every block has computed/inherited defaults
                            // so raw-access paths (AssetSearchFilter) don't crash.
                            if (asset.blocks) {
                                for (const block of asset.blocks) {
                                    if (!block.computed) block.computed = {};
                                    if (block.inherited === undefined) block.inherited = null;
                                }
                            }
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
                        else if (/\.json$/i.test(item.name) && !item.name.endsWith('.schema.json') && !item.name.endsWith('.bindings.json')) {
                            // Flat JSON data file
                            const flat = JSON.parse(file) as Record<string, any>;
                            // Skip if it looks like an IMS file (has blocks array)
                            if (flat.blocks && Array.isArray(flat.blocks)) continue;
                            // Determine workspace directory name for schema lookup
                            const wsDir = node_path.basename(path).toLowerCase();
                            const asset = this._flatToAsset(flat, local_name, local_path, root_path, workspace_id, created_at, updated_at, wsDir);
                            assets.set(asset.localName!, asset);
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
        // Deduplicate: if a flat .json file exists alongside a .ima.json file
        // for the same asset title, prefer the flat file and remove the ima version.
        const flatTitles = new Set<string>();
        for (const [localName, asset] of assets) {
            if (localName.endsWith('.json') && !localName.endsWith('.ima.json')) {
                flatTitles.add((asset.title || '').toLowerCase());
            }
        }
        if (flatTitles.size > 0) {
            for (const [localName, asset] of assets) {
                if (localName.endsWith('.ima.json') && flatTitles.has((asset.title || '').toLowerCase())) {
                    assets.delete(localName);
                }
            }
        }

        return {
            assets,
            workspaces
        }
    }

    private _schemaPropsMap: Map<string, Record<string, any>> | null = null;

    private _getSchemaProps(rootPath: string, wsDir: string): Record<string, any> | undefined {
        if (!this._schemaPropsMap) {
            this._schemaPropsMap = loadSchemaPropsMap(rootPath);
        }
        return this._schemaPropsMap.get(wsDir);
    }

    /**
     * Convert a flat JSON data object into a ProjectFileDbAsset with synthetic blocks.
     * The asset gets a deterministic UUID from its file path. Properties are placed
     * into a description text block and a props block. __props metadata is synthesized
     * from JSON Schema files so the property editor knows field types.
     */
    private _flatToAsset(
        flat: Record<string, any>,
        local_name: string,
        local_path: string,
        root_path: string,
        workspace_id: string,
        created_at: string,
        updated_at: string,
        wsDir: string = '',
    ): ProjectFileDbAsset {
        const asset_id = flat.id || absolutePathToUuid(local_path, root_path);
        const blocks: ProjectFileDbAssetBlock[] = [];
        let block_index = 0;

        // Description block (if present)
        if (flat.description != null) {
            blocks.push({
                id: uuidv4(),
                type: 'text',
                name: 'description',
                title: '[[t:Description]]',
                index: block_index++,
                createdAt: created_at,
                updatedAt: updated_at,
                ownTitle: null,
                own: true,
                props: { value: flat.description },
                computed: { value: flat.description },
                inherited: null,
            });
        }

        // Script block for dialogues
        if (flat.script != null && typeof flat.script === 'object') {
            blocks.push({
                id: uuidv4(),
                type: 'script',
                name: 'content',
                title: '[[t:Content]]',
                index: block_index++,
                createdAt: created_at,
                updatedAt: updated_at,
                ownTitle: null,
                own: true,
                props: flat.script,
                computed: flat.script,
                inherited: null,
            });
        }

        // Props block with all remaining fields
        const props: Record<string, any> = {};
        for (const [key, value] of Object.entries(flat)) {
            if (key === 'title' || key === 'description' || key === 'script' || key === 'id') continue;
            if (value == null) continue;
            props[key] = value;
        }

        // Inject __props metadata from JSON Schema so the property editor
        // knows field types (enum dropdowns, element selector pickers, etc.)
        const schemaProps = this._getSchemaProps(root_path, wsDir);
        const computed = { ...props };
        if (schemaProps) {
            computed.__props = schemaProps;
        }

        if (Object.keys(props).length > 0 || schemaProps) {
            blocks.push({
                id: uuidv4(),
                type: 'props',
                name: 'props',
                title: '[[t:Properties]]',
                index: block_index++,
                createdAt: created_at,
                updatedAt: updated_at,
                ownTitle: null,
                own: true,
                props,
                computed,
                inherited: null,
            });
        }

        const inferredTypeId = FLAT_DIR_TO_TYPE_ID[wsDir] ?? null;
        const typeIds = inferredTypeId ? [inferredTypeId] : [];

        return {
            id: asset_id,
            projectId: this.db.project.db.info.id ?? '',
            workspaceId: workspace_id,
            name: null,
            title: flat.title || node_path.basename(local_name, '.json'),
            icon: null,
            isAbstract: false,
            typeIds,
            createdAt: created_at,
            updatedAt: updated_at,
            deletedAt: null,
            rights: AssetRights.FULL_ACCESS,
            index: null,
            creatorUserId: null,
            unread: 0,
            hasImage: false,
            parentIds: typeIds,
            ownTitle: flat.title || node_path.basename(local_name, '.json'),
            ownIcon: null,
            blocks,
            comments: [],
            references: [],
            lastViewedAt: null,
            localName: local_name,
        };
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
