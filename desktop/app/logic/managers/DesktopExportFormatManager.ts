import SyncStoreCore from '~ims-app-base/logic/types/SyncStoreCore';
import ExportFormatManager, { type ExportFormatWithId } from '~ims-app-base/logic/managers/ExportFormatManager';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import ProjectSettingsManager from '~ims-app-base/logic/managers/SettingsSubContext';

export default class DesktopExportFormatManager extends ExportFormatManager {
  protected _core: SyncStoreCore;

  constructor(appManager: IAppManager) {
    super(appManager);
    this._core = new SyncStoreCore({
      storageGetter: async () =>
        window.imshost.storage.getItem('exportFormats-' + 0),
      storageSetter: async (val) =>
        window.imshost.storage.setItem('exportFormats-' + 0, val),
    });
  }

  override async init(): Promise<void> {
    await this._core.init();
  }

  private async _migrateLegacyFormats() {
    const legacy_formats = Object.values(this._core.getAll()) as ExportFormatWithId[];
    if (!legacy_formats || !legacy_formats.length) return;
    for (const format of legacy_formats) {
      await this.appManager.get(ProjectSettingsManager).setValue('export-format', format.id, format);
    }
    this._core.setAll({});
  }

  public override async saveExportFormat(format: ExportFormatWithId): Promise<void> {
    if (!this._core.inited) return;
    await this._migrateLegacyFormats();
    this.appManager.get(ProjectSettingsManager).setValue('export-format', format.id, format);
  }

  public override getExportFormats(): ExportFormatWithId[] {
    if (!this._core.inited) return [];
    const legacy_formats = Object.values(this._core.getAll());
    const formats = Object.values(this.appManager.get(ProjectSettingsManager).getValue('export-format') ?? {}) as any[];
    return [...legacy_formats, ...formats];
  }

  public override async deleteExportFormat(id: string): Promise<void> {
    if (!this._core.inited) return;

    await this._migrateLegacyFormats();

    await this.appManager.get(ProjectSettingsManager).setValue('export-format', id, null);
  }
}