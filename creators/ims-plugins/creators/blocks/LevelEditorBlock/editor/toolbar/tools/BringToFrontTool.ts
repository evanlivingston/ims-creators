import type { ToolSection } from '../ToolManager';
import SelectionRequiredTool from './base/SelectionRequiredTool';

export default class BringToFrontTool extends SelectionRequiredTool {
  name = 'bringToFront';
  icon = 'ri-bring-to-front';
  section: ToolSection = 'layers';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;

  override onActivate() {
    if (
      !this.controller.blockController.selectionManager.selectedObjectIds.length
    )
      return;

    const active_objects = this.controller.canvas.getActiveObjects();

    for (const active_object of active_objects.reverse()) {
      const collection = active_object.parent
        ? active_object.parent
        : this.controller.canvas;

      const index = this.controller.generateNewMaxIndex(collection);
      this.controller.changeShape(
        active_object.id,
        { index },
        { expectPropsChange: false },
      );
    }

    this.deactivate();
  }
}
