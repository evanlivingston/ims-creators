import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { resolveWorkspace, createAssetFromFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'workspace') || '';
  const ws = await resolveWorkspace(slug);
  if (!ws) throw createError({ statusCode: 404, statusMessage: `Workspace "${slug}" not found` });

  const body = await readBody(event);
  // Merge data field into top level (ChatGPT sends properties inside data:{})
  const flat = { ...body.data, ...body };
  delete flat.data;
  if (!flat.title) throw createError({ statusCode: 400, statusMessage: 'title is required' });

  try {
    return await createAssetFromFlat(ws.id, flat);
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create asset' });
  }
});
