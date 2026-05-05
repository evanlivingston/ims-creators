import { BlockEditorController } from '~ims-app-base/logic/types/BlockEditorController';

/**
 * Minimal controller for the bark list block. The bark editor is a simple
 * list of rows, no graph/computed state, so the default controller is
 * sufficient. Subclassing keeps the door open for future content-tree items
 * (jump-to-bark anchors, bark count, etc).
 */
export class BarkBlockController extends BlockEditorController {}
