import type { LevelEditorShape } from '../../LevelEditor';
import type { ToolSection } from '../ToolManager';
import ShapeCreationTool, {
  type ShapeCreationParams,
} from './base/ShapeCreationTool';
import type * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';

export default class TextTool extends ShapeCreationTool {
  name = 'text';
  icon = 'ri-text-snippet';
  component = async () =>
    (await import('../LevelEditorToolbarButton.vue')).default;
  section: ToolSection = 'draw';
  override exclusiveGroup: string = 'drawing';

  protected override onShapeCreated(shape: fabric.Textbox): void {
    shape.enterEditing();
  }

  override createShape(
    params: ShapeCreationParams,
    _isDragMode?: boolean,
  ): LevelEditorShape {
    return {
      id: uuidv4(),
      type: 'textbox',
      x: params.left,
      y: params.top,
      index: 0,
      params: {
        width: params.width,
        fill: '#FFFFFF',
      },
    };
  }
  override updateShape(
    shape: fabric.FabricObject,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const left = Math.min(from.x, to.x);
    const top = Math.min(from.y, to.y);
    const width = Math.abs(to.x - from.x);
    shape.set({
      width: width,
      left: left,
      top: top,
    });
  }
}
