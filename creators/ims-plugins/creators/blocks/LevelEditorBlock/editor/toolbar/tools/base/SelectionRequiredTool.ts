import Tool from './Tool';
import type * as fabric from 'fabric';

export default abstract class SelectionRequiredTool extends Tool {
  protected selectedObjects: fabric.FabricObject[] = [];
  protected selectionShapeTypes = false as false | string[];

  selectedObjectsChanged(_objects: fabric.FabricObject[]) {}

  override isDisabled() {
    return (
      this.controller.blockController.selectionManager.selectedObjectIds
        .length === 0
    );
  }
}
