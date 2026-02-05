import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import {
  COLOR_PROPERTY_DESCRIPTORS,
  type ShapePropertyDescriptor,
} from '../shapePropertyDescriptors';

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

  override getSpecialPropertyDescriptors(): ShapePropertyDescriptor<
    PolygonShape,
    any
  >[] {
    return [...COLOR_PROPERTY_DESCRIPTORS];
  }
}
