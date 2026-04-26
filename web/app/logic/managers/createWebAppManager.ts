import AppManager from '~ims-app-base/logic/managers/AppManager';
import ApiManager from '~ims-app-base/logic/managers/ApiManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import AuthManager from '~ims-app-base/logic/managers/AuthManager';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import CommentManager from '~ims-app-base/logic/managers/CommentManager';
import LocalFsSyncManager from '~ims-app-base/logic/managers/LocalFsSyncManager';
import PluginManager from '~ims-app-base/logic/managers/Plugin/PluginManager';
import EditorManager from '~ims-app-base/logic/managers/EditorManager';
import ProjectContentManager from '~ims-app-base/logic/managers/ProjectContentManager';
import GlobalStateManager from '~ims-app-base/logic/managers/GlobalStateManager';
import ExportFormatManager from '~ims-app-base/logic/managers/ExportFormatManager';
import TaskManager from '~ims-app-base/logic/managers/TaskManager';
import type { BaseAppConfiguration } from '~ims-app-base/logic/configurations/base-app-configuration';
import type { AppManagerContext } from '~ims-app-base/logic/managers/IAppManager';
import type { IApiTokenStorage } from '~ims-app-base/logic/managers/ApiWorker';

import WebCreatorManager from './WebCreatorManager';
import WebProjectManager from './WebProjectManager';
import WebUiManager from './WebUiManager';
import WebEditorManager from './WebEditorManager';
import WebExportFormatManager from './WebExportFormatManager';
import WebProjectContentManager from './WebProjectContentManager';
import { ProjectDatabaseViaHttpApi } from '../types/ProjectDatabaseViaHttpApi';

import pluginBase from '~ims-plugin-base/index';
import pluginCreators from '~ims-plugin-creators/index';

export function createApiTokenStorage(
  _context: AppManagerContext,
): IApiTokenStorage {
  return {
    getMain() {
      return {
        userId: 'local-user',
        accessToken: 'local',
        remember: true,
      };
    },
    async getRefreshToken() {
      return undefined;
    },
    async save() {},
    async clear() {},
  };
}

export default function createWebAppManager(
  context: AppManagerContext,
  $appConfiguration: BaseAppConfiguration,
): AppManager {
  const app_manager = new AppManager(context, $appConfiguration);

  const apiManager = new ApiManager(app_manager);
  app_manager.register(apiManager);
  app_manager.register(AuthManager, new AuthManager(app_manager));

  const webCreatorManager = new WebCreatorManager(app_manager);
  app_manager.register(WebCreatorManager, webCreatorManager);

  app_manager.register(new CreatorAssetManager(app_manager));

  const webProjectManager = new WebProjectManager(app_manager);
  app_manager.register(ProjectManager, webProjectManager);
  app_manager.register(WebProjectManager, webProjectManager);

  const webUiManager = new WebUiManager(app_manager);
  app_manager.register(UiManager, webUiManager);
  app_manager.register(WebUiManager, webUiManager);

  app_manager.register(UiPreferenceManager, new UiPreferenceManager(app_manager));
  app_manager.register(new DialogManager(app_manager));
  app_manager.register(new CommentManager(app_manager));
  app_manager.register(new LocalFsSyncManager(app_manager));
  app_manager.register(new PluginManager(app_manager));
  app_manager.register(EditorManager, new WebEditorManager(app_manager));
  app_manager.register(ExportFormatManager, new WebExportFormatManager(app_manager));

  const webProjectContentManager = new WebProjectContentManager(app_manager);
  app_manager.register(ProjectContentManager, webProjectContentManager);

  app_manager.register(new GlobalStateManager(app_manager));
  app_manager.register(new TaskManager(app_manager));

  const project_database = new ProjectDatabaseViaHttpApi();

  app_manager.addInitRoutine(async () => {
    await app_manager.get(ApiManager).init(createApiTokenStorage(context));
    await app_manager.get(LocalFsSyncManager).init();
    await webUiManager.init(context);
    await webCreatorManager.init();
    await app_manager.get(ProjectManager).init();
    await app_manager.get(CreatorAssetManager).init(project_database, false);
    await app_manager.get(ExportFormatManager).init();
  });

  app_manager.addInitRoutine(async () => {
    await app_manager.get(PluginManager).activateInternalPlugin(pluginBase());
    await app_manager.get(PluginManager).activateInternalPlugin(pluginCreators());
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
