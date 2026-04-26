import { defineEventHandler } from 'h3';
import { getProjectDb } from '../../utils/project-db';

export default defineEventHandler(async () => {
  const db = await getProjectDb();

  // Get all user workspaces
  const workspaces = await db.workspace.workspacesGet({ where: { isSystem: false } });

  // Get type assets (from Types workspace)
  const typesWorkspace = workspaces.list.find((w: any) => w.title === 'Types');
  let types: any[] = [];
  if (typesWorkspace) {
    const typeAssets = await db.asset.assetsGetShort({ where: { workspaceId: typesWorkspace.id } });
    types = (typeAssets.list || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      icon: a.icon,
    }));
  }

  // Build workspace-to-type mapping by matching names
  const workspaceTypeMap: Record<string, any> = {};
  for (const ws of workspaces.list) {
    // Try to find a type whose title matches the workspace title (singular form)
    const singular = (ws as any).title?.replace(/s$/, '').replace(/ies$/, 'y');
    const matchedType = types.find((t: any) =>
      t.title === singular ||
      t.title === (ws as any).title ||
      t.title?.toLowerCase() === singular?.toLowerCase()
    );
    if (matchedType) {
      workspaceTypeMap[(ws as any).id] = { typeId: matchedType.id, typeTitle: matchedType.title };
    }
  }

  // Get one example asset from each workspace
  const examples: any[] = [];
  for (const ws of workspaces.list) {
    if ((ws as any).title === 'Types') continue;
    try {
      const assets = await db.asset.assetsGetShort({ where: { workspaceId: (ws as any).id }, count: 1 });
      const list = assets.list || [];
      if (list.length > 0) {
        // Get full details for the example
        const full = await db.asset.assetsGetFull({ where: { id: list[0].id } });
        const fullList = full.list || [];
        if (fullList.length > 0) {
          examples.push({
            workspace: (ws as any).title,
            workspaceId: (ws as any).id,
            asset: fullList[0],
          });
        }
      }
    } catch {
      // Skip workspaces that error
    }
  }

  return {
    project: db.info.title,
    description: 'When creating assets, always include parentIds with the type ID for the workspace. The workspaceTypeMap shows which type each workspace uses.',
    workspaces: workspaces.list.map((w: any) => ({ id: w.id, title: w.title })),
    types,
    workspaceTypeMap,
    examples,
  };
});
