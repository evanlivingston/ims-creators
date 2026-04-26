import { defineEventHandler, readBody } from 'h3';
import { getProjectDb } from '../../../utils/project-db';

// Normalize create params - ChatGPT may send flat or nested format
function normalizeCreateParams(body: any): any {
  // Already in correct format with set wrapper
  if (body.set) return body;
  // Flat format from ChatGPT - wrap in set
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const params = normalizeCreateParams(body);
  if (params.set?.blocks) {
    params.set.blocks = normalizeBlocks(params.set.blocks);
  }
  const db = await getProjectDb();
  return db.asset.assetsCreate(params);
});
