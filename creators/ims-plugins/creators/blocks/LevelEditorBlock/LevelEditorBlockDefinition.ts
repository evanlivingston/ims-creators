import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import type { BlockEditorController } from '~ims-app-base/logic/types/BlockEditorController';
import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import LevelEditorBlockController from './LevelEditorBlockController';

export class LevelEditorBlockDefinition extends BlockTypeDefinition {
  name = 'leveleditor';
  component = async () => (await import('./LevelEditorBlock.vue')).default;
  icon = 'map-2-line';
  override resizableBlockHeight = true;

  override createController(
    appManager: IAppManager,
    getResolvedBlock: () => ResolvedAssetBlock | null,
  ): BlockEditorController {
    return new LevelEditorBlockController(appManager, getResolvedBlock);
  }
}
