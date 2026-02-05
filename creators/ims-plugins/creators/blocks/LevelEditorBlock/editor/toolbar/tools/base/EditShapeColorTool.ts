import type { ToolSection } from '../../ToolManager';
import SelectionRequiredTool from './SelectionRequiredTool';
import type * as fabric from 'fabric';

export type ColorSet = {
  fill: string;
  stroke: string;
};

const COLOR_PRESETS: ColorSet[] = [
  {
    fill: '#EED81133',
    stroke: '#EED811',
  },
  {
    fill: '#3dee114d',
    stroke: '#3dee11ff',
  },
  {
    fill: '#11eee34d',
    stroke: '#11eee3ff',
  },
  {
    fill: '#a811ee4d',
    stroke: '#a811eeff',
  },
  {
    fill: '#ee11234d',
    stroke: '#ee1123ff',
  },
  {
    fill: '#ffffff4d',
    stroke: '#ffffff',
  },
  {
    fill: '#0000004d',
    stroke: '#000000',
  },
  {
    fill: '#EED811',
    stroke: '#EED811',
  },
  {
    fill: '#3dee11',
    stroke: '#3dee11ff',
  },
  {
    fill: '#11eee3',
    stroke: '#11eee3ff',
  },
  {
    fill: '#a811ee',
    stroke: '#a811eeff',
  },
  {
    fill: '#ee1123',
    stroke: '#ee1123ff',
  },
  {
    fill: '#ffffff',
    stroke: '#ffffff',
  },
  {
    fill: '#000000',
    stroke: '#000000',
  },
];

export default abstract class EditShapeColorTool extends SelectionRequiredTool {
  component = async () =>
    (await import('../../LevelEditorToolbarEditColorButton.vue')).default;
  section: ToolSection = 'shapeEdit';
  override hideWhenDisabled = true;

  protected override selectionShapeTypes = [
    'rect',
    'ellipse',
    'polygon',
    'textbox',
  ];

  protected currentColorSet: ColorSet | null = null;
  abstract editProp: string | null;

  override init() {
    super.init();
    this.componentProps = {
      colors: COLOR_PRESETS,
      editProp: this.editProp,
      getCurrentColorSet: () => this.currentColorSet,
      onColorChange: (color: { fill: string; stroke: string }) =>
        this._changeColor(color),
    };
  }

  override selectedObjectsChanged(objects: fabric.FabricObject[]): void {
    if (objects.length > 0) {
      this.currentColorSet = {
        fill: objects[0].get('fill'),
        stroke: objects[0].get('stroke'),
      };
    } else {
      this.currentColorSet = null;
    }
  }

  private _changeColor(color: { fill: string; stroke: string }) {
    if (!this.selectedObjects.length) return;
    this.currentColorSet = color;
    for (const active_object of this.selectedObjects) {
      if (!this.editProp) {
        active_object.set({ ...color });
        this.controller.changeShape(active_object.id, {
          params: { ...color },
        } as any);
      } else {
        active_object.set(this.editProp, color[this.editProp]);

        this.controller.changeShape(active_object.id, {
          params: { [this.editProp]: color[this.editProp] },
        } as any);
      }
    }
    this.controller.canvas.requestRenderAll();
  }
}
