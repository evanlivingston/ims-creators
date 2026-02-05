import { defineNuxtRouteMiddleware, useNuxtApp } from '#app';
import { useAppManager } from '../composables/useAppManager';
import DesktopUiManager from '../logic/managers/DesktopUiManager';

export default defineNuxtRouteMiddleware(async (to) => {
  const appManager = useAppManager();
  appManager.get(DesktopUiManager).tabController.pushCurrentTabRoute(to);
  
  return true;
});
