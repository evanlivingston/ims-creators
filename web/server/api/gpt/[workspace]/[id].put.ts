import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { updateAssetFromFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
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

  try {
    const result = await updateAssetFromFlat(id, flat);
    if (!result) throw createError({ statusCode: 404, statusMessage: `Asset "${id}" not found` });
    return result;
  } catch (err: any) {
    if (err.statusCode) throw err;
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to update asset' });
  }
});
