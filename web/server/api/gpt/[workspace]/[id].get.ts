import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getAssetFlat } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
  const asset = await getAssetFlat(id);
  if (!asset) throw createError({ statusCode: 404, statusMessage: `Asset "${id}" not found` });
  return asset;
});
