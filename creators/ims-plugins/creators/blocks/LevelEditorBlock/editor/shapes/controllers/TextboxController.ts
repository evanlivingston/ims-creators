import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import {
  COLOR_PROPERTY_DESCRIPTORS,
  WIDTH_PROPERTY_DESCRIPTOR,
  type ShapePropertyDescriptor,
} from '../shapePropertyDescriptors';
import { castAssetPropValueToString } from '~ims-app-base/logic/types/Props';
import NumberField from '../../side-panel/fields/NumberField.vue';
import type DecorationLabel from '../../../canvas/DecorationLabel';
import { shapeValueToString } from '../../../canvas/DecorationLabel';
import ButtonsField from '../../side-panel/fields/ButtonsField.vue';
import type LevelEditorCanvasController from '../../LevelEditorCanvasController';

export type TextboxShape = Extract<LevelEditorShape, { type: 'textbox' }>;

export default class TextboxController extends BaseShapeController<TextboxShape> {
  name = 'textbox';
  icon = 'ri-text-snippet';

  protected override collectUpdates(
    existing_object: fabric.Textbox,
    new_data: Partial<TextboxShape>,
    canvasController: LevelEditorCanvasController,
  ): Partial<fabric.FabricObject> {
    const updates = super.collectUpdates(
      existing_object,
      new_data,
      canvasController,
    ) as Partial<fabric.Textbox>;

    if (
      new_data.params?.width !== undefined &&
      existing_object.width !== new_data.params.width
    ) {
      updates.width = new_data.params.width;
    }

    if (
      new_data.params?.textAlign !== undefined &&
      existing_object.textAlign !== new_data.params.textAlign
    ) {
      updates.textAlign = new_data.params.textAlign;
    }

    const current_text = existing_object.text;
    const new_text = shapeValueToString(new_data.value);

    if (current_text !== new_text) {
      updates.text = new_text ?? '';
    }
    return updates;
  }

  createFabricObject(shape: TextboxShape, readonly: boolean = false) {
    return markRaw(
      new fabric.Textbox(castAssetPropValueToString(shape.value ?? ''), {
        id: shape.id,
        index: shape.index,
        left: shape.x,
        top: shape.y,
        skewX: shape.skew ?? 0,
        scaleX: shape.scaleX ?? 1,
        scaleY: shape.scaleY ?? 1,
        angle: shape.angle ?? 0,
        parentId: shape.parentId ?? undefined,
        ...shape.params,
        fontFamily: 'Ubuntu',

        selectable: !shape.locked,
        evented: !shape.locked,
        editable: !readonly,
      }),
    );
  }

  override updateDecoration(
    _existing_object: fabric.Textbox,
    _value: TextboxShape['value'],
  ): DecorationLabel | undefined {
    return undefined;
  }

  override getSpecialPropertyDescriptors(): ShapePropertyDescriptor<
    TextboxShape,
    any
  >[] {
    return [
      {
        key: 'textAlign',
        title: 'textAlign',
        editorComponent: ButtonsField,
        editorProps: {
          options: [
            {
              key: 'textAlignLeft',
              value: 'left',
              icon: 'ri-align-left',
            },
            {
              key: 'textAlignCenter',
              value: 'center',
              icon: 'ri-align-center',
            },
            {
              key: 'textAlignRight',
              value: 'right',
              icon: 'ri-align-right',
            },
            {
              key: 'textAlignJustify',
              value: 'justify',
              icon: 'ri-align-justify',
            },
          ],
        },
        get: (obj, _controller) => obj.params.textAlign,
        set: (obj, value, controller) => {
          controller.changeShape(
            obj.id,
            { params: { textAlign: value } },
            { expectPropsChange: false },
          );
        },
      },
      { ...WIDTH_PROPERTY_DESCRIPTOR },
      {
        key: 'scaleX',
        title: 'ScaleX',
        group: 'scale',
        section: 'main',
        index: 0,
        editorComponent: NumberField,
        editorProps: {
          icon: {
            type: 'text',
            value: 'X',
          },
        },
        get: (shape, _controller) => shape.scaleX ?? 0,
        set: (shape, value, controller) => {
          controller.changeShape(
            shape.id,
            { scaleX: value },
            { expectPropsChange: false },
          );
        },
      },
      {
        key: 'scaleY',
        title: 'ScaleY',
        group: 'scale',
        section: 'main',
        index: 1,
        editorComponent: NumberField,
        editorProps: {
          icon: {
            type: 'text',
            value: 'Y',
          },
        },
        get: (shape, _controller) => shape.scaleY ?? 0,
        set: (shape, value, controller) => {
          controller.changeShape(
            shape.id,
            { scaleY: value },
            { expectPropsChange: false },
          );
        },
      },
      ...COLOR_PROPERTY_DESCRIPTORS,
    ];
  }
}
