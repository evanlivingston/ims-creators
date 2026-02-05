import SyncStoreCore from '~ims-app-base/logic/types/SyncStoreCore';
import ExportFormatManager, { type ExportFormatWithId } from '~ims-app-base/logic/managers/ExportFormatManager';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';

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

  public override async saveExportFormat(format: ExportFormatWithId): Promise<void> {
    if (!this._core.inited) return;
    this._core.setKey(format.id, format);
  }

  public override getExportFormats(): ExportFormatWithId[] {
    if (!this._core.inited) return [];
    return Object.values(this._core.getAll());
  }

  public override async deleteExportFormat(id: string): Promise<void> {
    if (!this._core.inited) return;
    
    const existing_formats = this._core.getAll();
    delete existing_formats[id];
    this._core.setAll(existing_formats);
  }
}