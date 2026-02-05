import { defineNuxtRouteMiddleware, useNuxtApp } from '#app';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import type DesktopUiManager from '../logic/managers/DesktopUiManager';

export default defineNuxtRouteMiddleware(async (to) => {
  const { $getAppManager } = useNuxtApp();

  await $getAppManager().get<DesktopUiManager>(UiManager).loadLanguage();
  return true;
});
