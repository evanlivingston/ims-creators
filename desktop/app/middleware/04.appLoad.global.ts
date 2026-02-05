import { defineNuxtRouteMiddleware } from '#app';
import type { AppLoadResult } from '~ims-app-base/logic/types/ProjectTypes';
import DesktopCreatorManager from '#logic/managers/DesktopCreatorManager';
import { useAppManager } from '#imports';

async function loadAppData(
  project: {
    id?: string;
    shortLink?: string;
  } | null,
): Promise<AppLoadResult> {
  const appManager = useAppManager();
  return await appManager.get(DesktopCreatorManager).appLoadData(project);
}

export default defineNuxtRouteMiddleware(async (to) => {
  const appManager = useAppManager();

  const projectPath = to.params.projectLink ? to.params.projectLink.toString() : '';

  const appInfo = await loadAppData(
    projectPath
      ? { id: projectPath } : null
  );
  appManager.get(DesktopCreatorManager).appActivate(appInfo, projectPath);
  return true;
});
