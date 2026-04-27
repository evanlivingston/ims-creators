import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { resolveWorkspace, createAssetFromFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'workspace') || '';
  const ws = await resolveWorkspace(slug);
  if (!ws) throw createError({ statusCode: 404, statusMessage: `Workspace "${slug}" not found` });

  const body = await readBody(event);
  // Parse properties from JSON string, data object, or top-level fields
  let props = {};
  if (typeof body.properties === 'string') {
    try { props = JSON.parse(body.properties); } catch {}
  } else if (typeof body.properties === 'object') {
    props = body.properties;
  }
  if (typeof body.data === 'object') Object.assign(props, body.data);
  const flat = { ...props, ...body };
  delete flat.properties;
  delete flat.data;
  if (!flat.title) throw createError({ statusCode: 400, statusMessage: 'title is required' });

  try {
    return await createAssetFromFlat(ws.id, flat);
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create asset' });
  }
});
