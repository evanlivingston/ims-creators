import { defineEventHandler, readBody } from 'h3';
import { getProjectDb } from '../../../utils/project-db';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = await getProjectDb();
  return db.asset.assetsChangeUndo(body.params, body.options);
});
