import { defineNuxtPlugin } from '#app';
import WebCreatorManager from '../logic/managers/WebCreatorManager';

export default defineNuxtPlugin({
  name: 'webStart',
  dependsOn: ['appManager'],
  async setup(app) {
    const app_manager = (app as any).getAppManager();
    await app_manager.init();

    const creatorManager = app_manager.get(WebCreatorManager);
    const appInfo = await creatorManager.appLoadData(null);
    creatorManager.appActivate(appInfo);
  },
});
