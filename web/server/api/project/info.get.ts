import { defineEventHandler } from 'h3';
import { getProjectDb } from '../../utils/project-db';

export default defineEventHandler(async () => {
  const db = await getProjectDb();
  return db.project.loadProjectInfo();
});
