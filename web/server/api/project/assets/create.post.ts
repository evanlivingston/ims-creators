import { defineEventHandler, readBody } from 'h3';
import { getProjectDb } from '../../../utils/project-db';

// Normalize create params - ChatGPT may send flat or nested format
function normalizeCreateParams(body: any): any {
  if (body.set) return body;
  const { id, ...rest } = body;
  return { id, set: rest };
}

// Normalize blocks from array format to keyed object format
function normalizeBlocks(blocks: any): any {
  if (!blocks || !Array.isArray(blocks)) return blocks;
  const result: Record<string, any> = {};
  for (const block of blocks) {
    const key = block.id ? `@${block.id}` : block.name;
    if (key) {
      const { id, name, ...rest } = block;
      result[key] = rest;
    }
  }
  return result;
}

// Auto-assign parentIds based on workspace if not provided
async function autoAssignType(params: any, db: any) {
  const set = params.set;
  if (!set?.workspaceId) return;
  if (set.parentIds && set.parentIds.length > 0) return;

  // Find type assets in the Types workspace
  const workspaces = await db.workspace.workspacesGet({ where: { isSystem: false } });
  const typesWorkspace = workspaces.list.find((w: any) => w.title === 'Types');
  if (!typesWorkspace) return;

  const targetWorkspace = workspaces.list.find((w: any) => w.id === set.workspaceId);
  if (!targetWorkspace) return;

  const typeAssets = await db.asset.assetsGetShort({ where: { workspaceId: typesWorkspace.id } });

  // Match workspace name to type name (Characters -> Character, Items -> Item, etc.)
  const wsTitle = (targetWorkspace as any).title || '';
  const singular = wsTitle.replace(/ies$/, 'y').replace(/s$/, '');

  const matchedType = (typeAssets.list || []).find((t: any) =>
    t.title === singular ||
    t.title === wsTitle ||
    t.title?.toLowerCase() === singular.toLowerCase()
  );

  if (matchedType) {
    set.parentIds = [matchedType.id];
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const params = normalizeCreateParams(body);
  if (params.set?.blocks) {
    params.set.blocks = normalizeBlocks(params.set.blocks);
  }
  const db = await getProjectDb();
  await autoAssignType(params, db);

  // Try creating with blocks, fall back to without if blocks cause errors
  try {
    return await db.asset.assetsCreate(params);
  } catch (err: any) {
    if (err.message?.includes('Type is not set') && params.set?.blocks) {
      // Drop malformed blocks - let the asset inherit from parent type
      delete params.set.blocks;
      return await db.asset.assetsCreate(params);
    }
    throw err;
  }
});
