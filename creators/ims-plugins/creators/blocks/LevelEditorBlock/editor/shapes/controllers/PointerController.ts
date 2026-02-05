import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import Pointer from '../../../canvas/Pointer';
import DecorationLabel from '../../../canvas/DecorationLabel';

import type * as fabric from 'fabric';
import type LevelEditorCanvasController from '../../LevelEditorCanvasController';

export type PointerShape = Extract<LevelEditorShape, { type: 'pointer' }>;

export default class PointerController extends BaseShapeController<PointerShape> {
  name = 'pointer';
  icon = 'ri-map-pin-add-line';

  createFabricObject(shape: PointerShape) {
    return markRaw(
      new Pointer(this.appManager, shape.value, {
        id: shape.id,
        index: shape.index,
        left: shape.x,
        top: shape.y,
        width: shape.params.width,
        height: shape.params.height,
        skewX: shape.skew ?? 0,
        angle: shape.angle ?? 0,
        scaleX: shape.scaleX ?? 1,
        scaleY: shape.scaleY ?? 1,
        parentId: shape.parentId ?? undefined,

        selectable: !shape.locked,
        evented: !shape.locked,
      }),
    );
  }

  protected override _createObjectLabel(
    value: PointerShape['value'],
    fabric_object: fabric.FabricObject,
  ): DecorationLabel | undefined {
    if (value === undefined) return undefined;

    const label = new DecorationLabel(value, fabric_object, this.appManager, {
      behavior: 'move-and-transform',
      position: 'top',
      hasBackground: true,
    });

    return label;
  }

  override updateFabricObject(
    existing_object: Pointer,
    new_data: Partial<PointerShape>,
    canvasController: LevelEditorCanvasController,
  ): void {
    super.updateFabricObject(existing_object, new_data, canvasController);
    existing_object.setValue(new_data.value);
  }
}
