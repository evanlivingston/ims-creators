import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import NumberField from '../../side-panel/fields/NumberField.vue';
import {
  COLOR_PROPERTY_DESCRIPTORS,
  type ShapePropertyDescriptor,
} from '../shapePropertyDescriptors';
import type LevelEditorCanvasController from '../../LevelEditorCanvasController';

export type EllipseShape = Extract<LevelEditorShape, { type: 'ellipse' }>;

export default class EllipseController extends BaseShapeController<EllipseShape> {
  name = 'ellipse';
  icon = 'ri-circle-line';

  protected override collectUpdates(
    existing_object: fabric.Ellipse,
    new_data: Partial<EllipseShape>,
    canvasController: LevelEditorCanvasController,
  ): Partial<fabric.Ellipse> {
    const updates = super.collectUpdates(
      existing_object,
      new_data,
      canvasController,
    ) as Partial<fabric.Ellipse>;

    if (
      new_data.params?.rx !== undefined &&
      existing_object.rx !== new_data.params.rx
    ) {
      updates.rx = new_data.params.rx;
    }
    if (
      new_data.params?.ry !== undefined &&
      existing_object.ry !== new_data.params.ry
    ) {
      updates.ry = new_data.params.ry;
    }
    return updates;
  }

  createFabricObject(shape: EllipseShape) {
    return markRaw(
      new fabric.Ellipse({
        id: shape.id,
        index: shape.index,
        left: shape.x,
        top: shape.y,
        scaleX: shape.scaleX ?? 1,
        scaleY: shape.scaleY ?? 1,
        skewX: shape.skew ?? 0,
        angle: shape.angle ?? 0,
        parentId: shape.parentId ?? undefined,
        ...shape.params,
        originY: 'center',
        originX: 'center',

        selectable: !shape.locked,
        evented: !shape.locked,
      }),
    );
  }

  override getSpecialPropertyDescriptors(): ShapePropertyDescriptor<
    EllipseShape,
    any
  >[] {
    return [
      {
        key: 'rx',
        title: 'RX',
        group: 'radius',
        section: 'main',
        index: 0,
        editorComponent: NumberField,
        editorProps: {
          icon: {
            type: 'text',
            value: 'RX',
          },
        },
        get: (shape) => shape.params.rx ?? 0,
        set: (shape, value, controller) => {
          controller.changeShape(
            shape.id,
            { params: { rx: value >= 0 ? value : 0 } } as any,
            { expectPropsChange: false },
          );
        },
      },
      {
        key: 'ry',
        title: 'RY',
        group: 'radius',
        section: 'main',
        index: 1,
        editorComponent: NumberField,
        editorProps: {
          icon: {
            type: 'text',
            value: 'RY',
          },
        },
        get: (shape) => shape.params.ry ?? 0,
        set: (shape, value, controller) => {
          controller.changeShape(
            shape.id,
            { params: { ry: value >= 0 ? value : 0 } } as any,
            { expectPropsChange: false },
          );
        },
      },
      ...COLOR_PROPERTY_DESCRIPTORS,
    ];
  }
}
