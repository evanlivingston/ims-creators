import { createError, defineNuxtRouteMiddleware } from '#app';
import { useAppManager } from '../composables/useAppManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';

export default defineNuxtRouteMiddleware(async (to) => {
  const appManager = useAppManager();
  const asset = await appManager
    .get(CreatorAssetManager)
    .getAssetShortViaCache(to.params.assetId.toString());
  if (!asset) {
      throw createError({
        statusCode: 404,
        message: appManager.$t('pages.pageNotFound'),
      });
  }
  return true;
});
