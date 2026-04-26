import { defineEventHandler, getRouterParam, createError } from 'h3';
import { resolveWorkspace, listAssetsFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'workspace') || '';
  const ws = await resolveWorkspace(slug);
  if (!ws) throw createError({ statusCode: 404, statusMessage: `Workspace "${slug}" not found` });
  return await listAssetsFlat(ws.id);
});
