import { defineNuxtRouteMiddleware, useNuxtApp } from '#app';
import UiManager from '~ims-app-base/logic/managers/UiManager';

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.client) {
    const { $getAppManager } = useNuxtApp();
    return await $getAppManager().get(UiManager).passNavigationGuards();
  }
  return true;
});
