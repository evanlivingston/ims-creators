import AppManager from '~ims-app-base/logic/managers/AppManager';
import ApiManager from '~ims-app-base/logic/managers/ApiManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import AuthManager from '~ims-app-base/logic/managers/AuthManager';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';
import DesktopCreatorManager from './DesktopCreatorManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import type { BaseAppConfiguration } from '~ims-app-base/logic/configurations/base-app-configuration'
import CommentManager from '~ims-app-base/logic/managers/CommentManager';
import type { AppManagerContext } from '~ims-app-base/logic/managers/IAppManager';
import PluginManager from '~ims-app-base/logic/managers/Plugin/PluginManager';
import EditorManager from '~ims-app-base/logic/managers/EditorManager';
import ProjectContentManager from '~ims-app-base/logic/managers/ProjectContentManager';
import GlobalStateManager from '~ims-app-base/logic/managers/GlobalStateManager';
import ExportFormatManager from '~ims-app-base/logic//managers/ExportFormatManager';
import LocalFsSyncManager from '~ims-app-base/logic/managers/LocalFsSyncManager';
import DesktopUiManager from './DesktopUiManager';
import DesktopProjectManager from './DesktopProjectManager'
import { ProjectDatabaseViaDesktopApi } from '../types/ProjectDatabaseViaDesktopApi';
import type { IApiTokenStorage } from '~ims-app-base/logic/managers/ApiWorker';
import { DesktopEditorManager } from './DesktopEditorManager';
import DesktopExportFormatManager from './DesktopExportFormatManager';

import pluginBase from '~ims-plugin-base/index'
import pluginCreators from '~ims-plugin-creators/index'
import TaskManager from '~ims-app-base/logic/managers/TaskManager';
import DesktopTaskManager from './DesktopTaskManager';
import DesktopProjectContentManager from './DesktopProjectContentManager';
import DesktopUpdateManager from './DesktopUpdateManager';

export function createApiTokenStorage(
  context: AppManagerContext,
): IApiTokenStorage {
  const base_cookie_opts = {
    path: '/',
    domain: context.$env.COOKIE_DOMAIN ? context.$env.COOKIE_DOMAIN : undefined,
  };
  let currentRefreshToken: string | undefined | null = null;
  return {
    getMain() {
      const accessToken = context.$cookies.get('ims-token');
      const remember = context.$cookies.get('ims-remember') !== '0';
      const userId = context.$cookies.get('ims-user-id');
      return {
        userId: userId ? userId : undefined,
        accessToken: accessToken ? accessToken : undefined,
        remember,
      };
    },
    async getRefreshToken(){
      if (currentRefreshToken !== null) {
        return currentRefreshToken;
      }
      const auth_data = await window.imshost.storage.getItem<Partial<{userId: string}>>("auth")
      if (!auth_data || !auth_data.userId) {
        currentRefreshToken = undefined;
        return undefined;
      }
      const private_data = await window.imshost.storage.getPrivateItem<Partial<{refreshToken: string}>>(auth_data.userId, 'auth');
      currentRefreshToken = private_data ? private_data.refreshToken : undefined;
      return currentRefreshToken;
    },
    async save(main, refreshToken) {
      const maxAge = main.remember
        ? new Date(Date.now() + 1440 * 60 * 60 * 1000)
        : undefined;
      const cookie_opts = {
        ...base_cookie_opts,
        expires: maxAge,
      };

      const main_user_id = main.userId;
      let clear = !main_user_id || !main.accessToken || !refreshToken;
      if (clear){
        await this.clear();
      }
      context.$cookies.set(
        'ims-remember',
        main.remember ? '1' : '0',
        cookie_opts,
      );
      if (clear || !main_user_id){
        return;
      }      

      context.$cookies.set('ims-token', main.accessToken ?? '', cookie_opts);
      context.$cookies.set('ims-user-id', main.userId ?? '', cookie_opts);
      if (currentRefreshToken !== refreshToken){
        currentRefreshToken = refreshToken;
        if (main.remember){
          await window.imshost.storage.setItem<Partial<{userId: string}>>("auth", {
            userId: main_user_id
          })
          await window.imshost.storage.setPrivateItem<Partial<{refreshToken: string}>>(main_user_id, 'auth', {
            refreshToken
          });
        }
      }
    },
    async clear() {
      context.$cookies.remove('ims-token', base_cookie_opts);
      context.$cookies.remove('ims-remember', base_cookie_opts);
      context.$cookies.remove('ims-user-id', base_cookie_opts);
      currentRefreshToken = undefined;
      const auth_data = await window.imshost.storage.getItem<Partial<{userId: string}>>("auth")
      await window.imshost.storage.removeItem('auth');
      if (auth_data && auth_data.userId){
        await window.imshost.storage.removePrivateItem(auth_data.userId, 'auth');
      }
    },
  };
}

export default function createDesktopAppManager(
  context: AppManagerContext,
  $appConfiguration: BaseAppConfiguration,
): AppManager {
  const app_manager = new AppManager(context, $appConfiguration);
  const apiManager = new ApiManager(app_manager);
  app_manager.register(apiManager);
  app_manager.register(AuthManager, new AuthManager(app_manager));
  app_manager.register(DesktopCreatorManager, new DesktopCreatorManager(app_manager));
  app_manager.register(new CreatorAssetManager(app_manager));
  const desktopProjectManager = new DesktopProjectManager(app_manager);
  app_manager.register(ProjectManager, desktopProjectManager);
  app_manager.register(DesktopProjectManager, desktopProjectManager);
  const desktopUiManager = new DesktopUiManager(app_manager)
  app_manager.register(UiManager, desktopUiManager);
  app_manager.register(DesktopUiManager, desktopUiManager);
  app_manager.register(UiPreferenceManager, new UiPreferenceManager(app_manager));
  app_manager.register(new DialogManager(app_manager));
  app_manager.register(new CommentManager(app_manager));
  app_manager.register(new LocalFsSyncManager(app_manager));
  app_manager.register(new PluginManager(app_manager));
  app_manager.register(EditorManager, new DesktopEditorManager(app_manager));
  app_manager.register(new DesktopUpdateManager(app_manager));
  app_manager.register(ExportFormatManager, new DesktopExportFormatManager(app_manager));
  const desktopProjectContentManager = new DesktopProjectContentManager(app_manager);
  app_manager.register(ProjectContentManager, desktopProjectContentManager);
  app_manager.register(new GlobalStateManager(app_manager));
  app_manager.register(TaskManager, new DesktopTaskManager(app_manager))
  
  const project_database = new ProjectDatabaseViaDesktopApi(desktopProjectManager);

  app_manager.addInitRoutine(async () => {
    await app_manager.get(ApiManager).init(createApiTokenStorage(context));
    await app_manager.get(LocalFsSyncManager).init();

    await desktopUiManager.init(context);
    await app_manager.get(DesktopCreatorManager).init();
    await app_manager.get(ProjectManager).init();
    await app_manager.get(CreatorAssetManager).init(project_database);
    await app_manager.get(ExportFormatManager).init();
  });


  app_manager.addInitRoutine(async () => {
    await app_manager.get(PluginManager).activatePlugin(pluginBase())
    await app_manager.get(PluginManager).activatePlugin(pluginCreators())
  });

  app_manager.addStateRoutine({
    key: 'assets',
    load: (state) => app_manager.get(CreatorAssetManager).loadState(state),
    save: () => app_manager.get(CreatorAssetManager).saveState(),
  });

  app_manager.addStateRoutine({
    key: 'globalState',
    load: (state) => app_manager.get(GlobalStateManager).loadState(state),
    save: () => app_manager.get(GlobalStateManager).saveState(),
  });


  return app_manager;
}
