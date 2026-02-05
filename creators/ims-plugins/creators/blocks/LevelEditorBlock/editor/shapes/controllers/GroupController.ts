import { markRaw } from 'vue';
import type { LevelEditorShape } from '../../LevelEditor';
import BaseShapeController from '../BaseShapeController';
import * as fabric from 'fabric';
import { LevelGroupLayoutStrategy } from '../../../canvas/LevelGroupLayoutStrategy';

export type GroupShape = Extract<LevelEditorShape, { type: 'group' }>;

export default class GroupController extends BaseShapeController<GroupShape> {
  name = 'group';
  icon = 'ri-artboard-2-line';

  createFabricObject(shape: GroupShape) {
    return markRaw(
      new fabric.Group([], {
        id: shape.id,
        index: shape.index,
        parentId: shape.parentId ?? undefined,
        layoutManager: new fabric.LayoutManager(new LevelGroupLayoutStrategy()),
      }),
    );
  }
}
