import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import {
  COLOR_PROPERTY_DESCRIPTORS,
  SIZE_PROPERTY_DESCRIPTORS,
} from '../shapePropertyDescriptors';
import type LevelEditorCanvasController from '../../LevelEditorCanvasController';

export type RectShape = Extract<LevelEditorShape, { type: 'rect' }>;

export default class RectController extends BaseShapeController<RectShape> {
  name = 'rect';
  icon = 'ri-rectangle-line';

  protected override collectUpdates(
    existing_object: fabric.FabricObject,
    new_data: Partial<RectShape>,
    canvasController: LevelEditorCanvasController,
  ): Partial<fabric.FabricObject> {
    const updates = super.collectUpdates(
      existing_object,
      new_data,
      canvasController,
    );

    if (
      new_data.params?.width !== undefined &&
      existing_object.width !== new_data.params.width
    ) {
      updates.width = new_data.params.width;
    }
    if (
      new_data.params?.height !== undefined &&
      existing_object.height !== new_data.params.height
    ) {
      updates.height = new_data.params.height;
    }

    return updates;
  }

  createFabricObject(shape: RectShape) {
    return markRaw(
      new fabric.Rect({
        id: shape.id,
        index: shape.index,
        left: shape.x,
        top: shape.y,
        skewX: shape.skew ?? 0,
        angle: shape.angle ?? 0,
        scaleX: shape.scaleX ?? 1,
        scaleY: shape.scaleY ?? 1,
        parentId: shape.parentId ?? undefined,
        ...shape.params,

        selectable: !shape.locked,
        evented: !shape.locked,
      }),
    );
  }

  override getSpecialPropertyDescriptors() {
    return [...SIZE_PROPERTY_DESCRIPTORS, ...COLOR_PROPERTY_DESCRIPTORS];
  }
}
