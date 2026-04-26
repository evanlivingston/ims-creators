import { defineEventHandler, getRouterParam, createError } from 'h3';
import { deleteAsset } from '../../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
  try {
    await deleteAsset(id);
    return { success: true, message: `Asset "${id}" deleted` };
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to delete asset' });
  }
});
