import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import SelectAssetDialog from '~ims-app-base/components/Asset/SelectAssetDialog.vue';
import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';
import { v4 as uuidv4 } from 'uuid';

export default class PointerTool extends Tool {
  name = 'pointer';
  icon = 'ri-map-pin-add-line';
  override exclusiveGroup: string = 'drawing';
  section: ToolSection = 'draw';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;

  override async onActivate() {
    const gdd_workspace = this.appManager
      .get(ProjectManager)
      .getWorkspaceByName('gdd');
    if (!gdd_workspace) return;
    const res = await this.appManager
      .get(DialogManager)
      .show(SelectAssetDialog, {
        where: {
          workspaceids: gdd_workspace.id,
        },
      });
    if (!res) {
      this.deactivate();
      return;
    }

    const assetPreview = await this.appManager
      .get(CreatorAssetManager)
      .getAssetPreviewViaCache(res.id);

    const vpCenter = this.controller.canvas.getVpCenter();

    this.controller.createShape(
      {
        id: uuidv4(),
        type: 'pointer',
        value: assetPreview
          ? {
              AssetId: assetPreview.id,
              Name: assetPreview?.name,
              Title: assetPreview?.title ?? '',
            }
          : '',
        x: vpCenter.x,
        y: vpCenter.y,
        params: {
          width: 100,
          height: 100,
        },
      },
      { expectPropsChange: false },
    );
    this.deactivate();
  }
}
