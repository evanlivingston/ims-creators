import { defineEventHandler, readBody } from 'h3';
import { getProjectDb } from '../../../utils/project-db';

// Normalize blocks from array format (ChatGPT) to keyed object format (ProjectFileDb)
function normalizeBlocks(blocks: any): any {
  if (!blocks) return blocks;
  // Already in correct format (keyed object)
  if (!Array.isArray(blocks)) return blocks;
  // Convert array of blocks to keyed object using block id or name
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const params = body.params || body;
  if (params.set?.blocks) {
    params.set.blocks = normalizeBlocks(params.set.blocks);
  }
  const db = await getProjectDb();
  return db.asset.assetsChange(params, body.options);
});
