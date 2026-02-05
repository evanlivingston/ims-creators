import { defineNuxtPlugin } from '#app';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import DesktopUiManager from '../logic/managers/DesktopUiManager';

export default defineNuxtPlugin({
  name: 'uiManager',
  dependsOn: ['appManager'],
  async setup(app) {
    const app_manger = (app as any).getAppManager() as IAppManager;
    app.hook('page:start', () => {
      app_manger.get(UiManager).pageNavigateState.setLoadStart();
    });
    app.hook('page:finish', () => {
      app_manger.get(UiManager).pageNavigateState.setLoadEnd(true);
    });
  },
});
