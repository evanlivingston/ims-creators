import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import type { BlockEditorController } from '~ims-app-base/logic/types/BlockEditorController';
import { BlockTypeDefinition } from '~ims-app-base/logic/types/BlockTypeDefinition';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import { BarkBlockController } from './BarkBlockController';

/**
 * Plugin registration for the Bark list editor. The web flat-asset loader
 * (FileSystemService) creates a block of type 'bark' for any flat JSON file
 * with a top-level `barks: [...]` array (currently used in design/Barks/).
 *
 * Top-level fields (character, location, cooldown) keep using the auto-rendered
 * Properties block; this plugin only owns the per-bark list editor with
 * inline ConditionBuilder.
 */
export class BarkBlockDefinition extends BlockTypeDefinition {
  name = 'bark';
  component = async () => (await import('./BarkBlock.vue')).default;
  icon = 'chat-voice-fill';

  // Bark blocks are added by the loader, never by the user from the editor's
  // "+ block" menu.
  override hideInAdding = true;

  override createController(
    appManager: IAppManager,
    getResolvedBlock: () => ResolvedAssetBlock | null,
  ): BlockEditorController {
    return new BarkBlockController(appManager, getResolvedBlock);
  }
}
