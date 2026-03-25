
import ProjectSettingsManager from '~ims-app-base/logic/managers/SettingsSubContext';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { AssetPropsPlainObject } from '~ims-app-base/logic/types/Props';
import type { ProjectSettingsValue } from '~ims-app-base/logic/types/ProjectTypes';

export default class DesktopProjectSettingsManager extends ProjectSettingsManager {
  override async reloadProjectSettings(): Promise<void> {
    
  }

  override async setValue(field: keyof ProjectSettingsValue, key: string, value: AssetPropsPlainObject | null): Promise<void> {
    const project_path = this.appManager.get(ProjectManager).getProjectInfo()?.localPath;
    if (!project_path) return;
    if (!this._projectSettings) return;

    if (!this._projectSettings.values) this._projectSettings.values = {};

    if (!this._projectSettings.values[field]) this._projectSettings.values[field] = {} as any;
    
    (this._projectSettings.values[field] as any)[key] = value;
    if (value === null) {
      delete (this._projectSettings.values[field] as any)[key];
    }
    await window.imshost.project.saveProjectSettings(project_path, this._projectSettings.values);
  }
}