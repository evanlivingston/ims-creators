import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { updateAssetFromFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
  const body = await readBody(event);
  // Merge data field into top level (ChatGPT sends properties inside data:{})
  const flat = { ...body.data, ...body };
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
