import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class UnlockAllTool extends Tool {
  name = 'unlock';
  icon = 'ri-lock-unlock-line';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
  section: ToolSection = 'lock';

  override onActivate(): void {
    const all_locked_objects = this.controller.sortedCanvasObjects.filter(
      (el) => !el.evented && !el.selectable,
    );
    for (const object of all_locked_objects) {
      object.set({
        evented: true,
        selectable: true,
      });
      this.controller.changeShape(object.id, { locked: false });
    }

    this.deactivate();
  }
}
