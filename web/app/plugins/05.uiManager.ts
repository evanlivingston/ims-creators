import { defineNuxtPlugin } from '#app';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';

export default defineNuxtPlugin({
  name: 'uiManager',
  dependsOn: ['appManager'],
  async setup(app) {
    const app_manager = (app as any).getAppManager() as IAppManager;
    app.hook('page:start', () => {
      app_manager.get(UiManager).pageNavigateState.setLoadStart();
    });
    app.hook('page:finish', () => {
      app_manager.get(UiManager).pageNavigateState.setLoadEnd(true);
    });
  },
});
