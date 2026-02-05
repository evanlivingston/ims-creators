import type { ToolSection } from '../ToolManager';
import Tool from './base/Tool';

export default class ViewAllTool extends Tool {
  name = 'viewAll';
  icon = 'ri-eye-line';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
  section: ToolSection = 'view';
  public override readonly = true;

  override onActivate(): void {
    const objects = this.controller.sortedCanvasObjects;
    if (!objects.length) {
      this.deactivate();
      return;
    }

    this.controller.showShapes(objects.map((el) => el.id));

    this.deactivate();
  }
}
