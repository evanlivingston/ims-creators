import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import { DialogSubContext } from '~ims-app-base/logic/project-sub-contexts/DialogSubContext';
import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';
import type { AssetProps } from '~ims-app-base/logic/types/Props';

export class TextGridBlockDefinition extends BlockTypeDefinition {
  name = 'textgrid';
  component = async () => (await import('./TextGridBlock.vue')).default;
  icon = 'layout-grid-fill';
  override hideInAdding = false;
  override focusOnAdded = false;
  override async beforeBlockCreate(
    projectContext: IProjectContext,
    params: { title: string },
  ): Promise<{ title: string; props?: AssetProps } | undefined> {
    const TextGridBlockSettingsDialog = (
      await import('./TextGridBlockSettingsDialog.vue')
    ).default;
    const res = await projectContext
      .get(DialogSubContext)
      .show(TextGridBlockSettingsDialog, {
        columnsCount: 4,
      });
    if (!res) return undefined;
    return {
      title: params.title,
      props: {
        columns: res.columnsCount,
      },
    };
  }
}
