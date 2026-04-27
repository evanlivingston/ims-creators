import { defineEventHandler, getQuery, createError } from 'h3';
import { getAllWorkspaces } from '../../utils/gpt-helpers';
import { getProjectDb } from '../../utils/project-db';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const name = (query.name || query.q || '') as string;
  if (!name) throw createError({ statusCode: 400, statusMessage: 'name or q parameter required' });

  const db = await getProjectDb();
  const workspaces = await getAllWorkspaces();
  const results: any[] = [];
  const nameLower = name.toLowerCase();

  for (const ws of workspaces) {
    const { list } = await db.asset.assetsGetShort({ where: { workspaceId: (ws as any).id } });
    for (const asset of (list || [])) {
      if (asset.title?.toLowerCase().includes(nameLower)) {
        results.push({ id: asset.id, title: asset.title, workspace: (ws as any).title });
      }
    }
  }

  return results;
});
