import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class LockTool extends Tool {
  name = 'lock';
  icon = 'ri-lock-line';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
  section: ToolSection = 'lock';

  private _disabled: boolean = true;

  override init() {
    this.controller.canvas.on('selection:created', () => {
      this._disabled = false;
    });
    this.controller.canvas.on('selection:cleared', () => {
      this._disabled = true;
    });
  }

  override onActivate(): void {
    const canvas_active_objects = this.controller.canvas.getActiveObjects();
    for (const object of canvas_active_objects) {
      object.set({
        selectable: false,
        evented: false,
      });
      this.controller.changeShape(object.id, { locked: true });
    }
    this.controller.canvas.discardActiveObject();
    this.controller.canvas.requestRenderAll();

    this.deactivate();
  }

  override isDisabled() {
    return this._disabled;
  }
}
