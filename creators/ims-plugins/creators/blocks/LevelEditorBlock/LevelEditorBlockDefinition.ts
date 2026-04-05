import type { BlockEditorController } from '~ims-app-base/logic/types/BlockEditorController';
import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import LevelEditorBlockController from './LevelEditorBlockController';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export class LevelEditorBlockDefinition extends BlockTypeDefinition {
  name = 'leveleditor';
  component = async () => (await import('./LevelEditorBlock.vue')).default;
  icon = 'map-2-line';
  override resizableBlockHeight = true;

  override createController(
    projectContext: IProjectContext,
    getResolvedBlock: () => ResolvedAssetBlock | null,
  ): BlockEditorController {
    return new LevelEditorBlockController(projectContext, getResolvedBlock);
  }
}
