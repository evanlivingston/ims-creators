import { AppSubManagerBase, type IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import { ProjectRolePulseRights, type AppLoadResult } from '~ims-app-base/logic/types/ProjectTypes';
import ApiManager from '~ims-app-base/logic/managers/ApiManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';

export default class WebCreatorManager extends AppSubManagerBase {
  isLoaded = false;
  protected _loadedData: AppLoadResult | null = null;

  constructor(appManager: IAppManager) {
    super(appManager);
  }

  async init(): Promise<void> {}

  async appLoadData(
    _project: { id?: string; shortLink?: string } | null,
  ): Promise<AppLoadResult> {
    if (this.isLoaded && this._loadedData) return this._loadedData;

    const app_data: AppLoadResult = {
      invitations: [],
      newsPopupId: null,
      project: null,
      projects: [],
      role: null,
      subscribers: {
        isSubscribed: false,
        total: 0,
      },
      unreadNotificationsCount: 0,
    };

    app_data.project = await $fetch('/api/project/info');
    app_data.role = {
      isAdmin: true,
      num: 1,
      pulseRights: ProjectRolePulseRights.ADMIN,
      title: 'Admin',
      rolesAssign: [],
    };

    return app_data;
  }

  appActivate(appInfo: AppLoadResult): void {
    if (this.isLoaded && this._loadedData === appInfo) {
      return;
    }

    this.isLoaded = false;
    if (appInfo.project) {
      this.appManager.get(ApiManager).setCurrentProjectId(appInfo.project.id);
    } else {
      this.appManager.get(ApiManager).setCurrentProjectId(null);
    }
    this.appManager.get(CreatorAssetManager).currentProjectUnload();
    this.appManager
      .get(ProjectManager)
      .setCurrentProjectInfo(appInfo.project ?? null, appInfo.role ?? null);
    if (appInfo.project) {
      this.appManager
        .get(CreatorAssetManager)
        .updateWorkspacesCache(appInfo.project.rootWorkspaces);
    }

    this._loadedData = appInfo;
    this.isLoaded = true;
  }

  async appReload() {
    this.isLoaded = false;
    this._loadedData = null;
    const appInfo = await this.appLoadData(null);
    this.appActivate(appInfo);
  }
}
