import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import {
  COLOR_PROPERTY_DESCRIPTORS,
  type ShapePropertyDescriptor,
} from '../shapePropertyDescriptors';
import type LevelEditorCanvasController from '../../LevelEditorCanvasController';

export type PolygonShape = Extract<LevelEditorShape, { type: 'polygon' }>;

export default class PolygonController extends BaseShapeController<PolygonShape> {
  name = 'polygon';
  icon = 'ri-shape-line';

  createFabricObject(shape: PolygonShape) {
    const origin = { x: shape.x, y: shape.y };
    const absolutePoints = shape.params.points.map((p) => ({
      x: p.x + origin.x,
      y: p.y + origin.y,
    }));
    return markRaw(
      new fabric.Polygon(absolutePoints, {
        id: shape.id,
        index: shape.index,
        fill: shape.params.fill,
        stroke: shape.params.stroke,
        parentId: shape.parentId ?? undefined,

        selectable: !shape.locked,
        evented: !shape.locked,
      }),
    );
  }

  protected override collectUpdates(
    existing_object: fabric.FabricObject,
    new_data: Partial<PolygonShape>,
    canvasController: LevelEditorCanvasController,
  ): Partial<fabric.Polygon> {
    const updates = super.collectUpdates(
      existing_object,
      new_data,
      canvasController,
    ) as Partial<fabric.Polygon>;

    if (new_data.params?.points !== undefined) {
      updates.points = new_data.params.points;
    }
    return updates;
  }

  override getSpecialPropertyDescriptors(): ShapePropertyDescriptor<
    PolygonShape,
    any
  >[] {
    return [...COLOR_PROPERTY_DESCRIPTORS];
  }

  protected override _afterFabricPropsSet(
    existing_object: fabric.Polygon,
  ): void {
    existing_object.setDimensions();
    existing_object.setCoords();
  }
}
