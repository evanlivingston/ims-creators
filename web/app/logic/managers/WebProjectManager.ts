import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { AssetShort } from '~ims-app-base/logic/types/AssetsType';
import type { Workspace } from '~ims-app-base/logic/types/Workspaces';

export default class WebProjectManager extends ProjectManager {
  override getAllowAnonymUsers() {
    return true;
  }

  override async exportAsset(_asset: AssetShort, _params?: Record<string, any>) {
    // Browser download would go here
  }

  override async exportWorkspace(_workspace: Workspace, _params?: Record<string, any>): Promise<void> {
    // Browser download would go here
  }
}
