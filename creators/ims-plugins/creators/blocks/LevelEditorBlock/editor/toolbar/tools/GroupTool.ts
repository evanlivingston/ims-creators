import type { LevelEditorShape } from '../../LevelEditor';
import type { ToolSection } from '../ToolManager';
import SelectionRequiredTool from './base/SelectionRequiredTool';
import type * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';

export default class GroupTool extends SelectionRequiredTool {
  name = 'group';
  icon = 'ims-icon-font-group-line';
  section: ToolSection = 'group';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
  override isDisabled() {
    return (
      this.controller.blockController.selectionManager.selectedObjectIds
        .length <= 1
    );
  }
  override onActivate() {
    const selected_object = this.controller.canvas.getActiveObject();
    if (!selected_object || selected_object.type !== 'activeselection') {
      return;
    }
    const op_id = this.controller.makeOpId();

    const active_objects = (
      selected_object as fabric.ActiveSelection
    ).getObjects();

    active_objects.forEach((obj) => {
      this.controller.canvas.remove(obj);
    });

    const group_id = uuidv4();
    const group_index = active_objects[active_objects.length - 1].index ?? 0;

    const group_props: LevelEditorShape = {
      id: group_id,
      type: 'group',
      x: selected_object.left,
      y: selected_object.top,
      params: {},
      index: group_index,
    };

    const group = this.controller.createShape(group_props, { opId: op_id });

    if (!group) return;

    for (const object of active_objects) {
      this.controller.changeShape(
        object.id,
        {
          parentId: group_id,
          x: object.left,
          y: object.top,
        },
        { expectPropsChange: false, opId: op_id },
      );
      object.set({
        parentId: group_id,
      });
    }
    (group as fabric.Group).add(...active_objects);
    this.controller.canvas.setActiveObject(group);
    group.setCoords();

    this.deactivate();
  }
}
