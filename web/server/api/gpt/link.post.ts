import { defineEventHandler, readBody, createError } from 'h3';
import { getProjectDb } from '../../utils/project-db';
import { autoCommit } from '../../utils/gpt-helpers';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { from, to } = body;

  if (!from || !to) {
    throw createError({ statusCode: 400, statusMessage: 'Both "from" and "to" asset IDs are required' });
  }

  const db = await getProjectDb();

  // Create bidirectional references
  try {
    await db.asset.assetsCreateRef({ where: { id: from }, targetAssetId: to });
    await db.asset.assetsCreateRef({ where: { id: to }, targetAssetId: from });
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create link' });
  }

  await autoCommit(`Link assets`);

  return { success: true, linked: [from, to] };
});
