import type { ToolSection } from '../ToolManager';
import SelectionRequiredTool from './base/SelectionRequiredTool';
import * as fabric from 'fabric';

export default class UngroupTool extends SelectionRequiredTool {
  name = 'ungroup';
  icon = 'ims-icon-font-ungroup-line';
  section: ToolSection = 'group';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;

  override hideWhenDisabled: boolean = false;

  override isDisabled() {
    if (
      this.controller.blockController.selectionManager.selectedObjectIds
        .length === 1 &&
      this.controller.blockController.shapes
    ) {
      return (
        this.controller.blockController.shapes[
          this.controller.blockController.selectionManager.selectedObjectIds[0]
        ]?.type !== 'group'
      );
    }
    return true;
  }
  override onActivate() {
    const group = this.controller.canvas.getActiveObject();
    if (!group || group.type !== 'group') {
      return;
    }

    const op_id = this.controller.makeOpId();

    const ungrouped_objects = (group as fabric.ActiveSelection)
      .removeAll()
      .filter((obj) => obj.type !== 'label');

    const group_collection = group.parent
      ? group.parent
      : this.controller.canvas;

    ungrouped_objects.forEach((obj) => group_collection.add(obj));

    for (const obj of ungrouped_objects) {
      this.controller.changeShape(
        obj.id,
        {
          parentId: null,
          x: obj.left,
          y: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          skew: obj.skewX,
        },
        { opId: op_id, expectPropsChange: false },
      );
      obj.set({
        parentId: undefined,
      });
    }

    this.controller.removeShape(group, {
      opId: op_id,
      expectPropsChange: false,
    });

    const sel = new fabric.ActiveSelection(ungrouped_objects, {
      canvas: this.controller.canvas,
    });
    this.controller.canvas.setActiveObject(sel);
    this.controller.canvas.requestRenderAll();

    this.deactivate();
  }
}
