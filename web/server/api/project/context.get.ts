import { defineEventHandler } from 'h3';
import { getProjectDb } from '../../utils/project-db';

export default defineEventHandler(async () => {
  const db = await getProjectDb();

  // Get all user workspaces
  const workspaces = await db.workspace.workspacesGet({ where: { isSystem: false } });

  // Get type assets (from Types workspace)
  const typesWorkspace = workspaces.list.find(w => w.title === 'Types');
  let types: any[] = [];
  if (typesWorkspace) {
    const typeAssets = await db.asset.assetsGetFull({ where: { workspaceId: typesWorkspace.id } });
    types = typeAssets.list.map((a: any) => ({
      id: a.id,
      title: a.title,
      icon: a.icon,
      blocks: a.blocks?.map((b: any) => ({
        id: b.id,
        type: b.type,
        name: b.name,
        title: b.title,
        props: b.props,
      })),
    }));
  }

  // Get one example asset from each workspace to show the pattern
  const examples: any[] = [];
  for (const ws of workspaces.list) {
    if (ws.title === 'Types') continue;
    const assets = await db.asset.assetsGetFull({ where: { workspaceId: ws.id }, count: 1 });
    if (assets.list.length > 0) {
      const a = assets.list[0] as any;
      examples.push({
        workspace: ws.title,
        workspaceId: ws.id,
        example: {
          id: a.id,
          title: a.title,
          parentIds: a.parentIds,
          typeIds: a.typeIds,
          icon: a.icon,
          blocks: a.blocks?.map((b: any) => ({
            id: b.id,
            type: b.type,
            name: b.name,
            title: b.title,
            props: b.props,
          })),
        },
      });
    }
  }

  return {
    project: db.info.title,
    workspaces: workspaces.list.map(w => ({ id: w.id, title: w.title })),
    types,
    examples,
  };
});
