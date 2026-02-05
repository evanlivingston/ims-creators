import { createError, defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAppManager } from '../composables/useAppManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';

export default defineNuxtRouteMiddleware(async (to) => {
  const appManager = useAppManager();
  const workspace = await appManager
    .get(CreatorAssetManager)
    .getWorkspaceByIdViaCache(
      (to.params.workspaceId
        ? to.params.workspaceId
        : to.params.boardId
      )?.toString(),
    );
  if (!workspace) {
      throw createError({
        statusCode: 404,
        message: appManager.$t('pages.pageNotFound'),
      });
  }
  return true;
});
