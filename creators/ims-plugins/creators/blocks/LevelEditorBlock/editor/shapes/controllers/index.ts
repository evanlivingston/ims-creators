import type { LevelEditorShape } from '../../LevelEditor';
import type BaseShapeController from '../BaseShapeController';
import EllipseController from './EllipseController';
import GroupController from './GroupController';
import ImageController from './ImageController';
import PointerController from './PointerController';
import PolygonController from './PolygonController';
import RectController from './RectController';
import TextboxController from './TextboxController';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export function getShapeControllers(projectContext: IProjectContext) {
  const list = [
    new RectController(projectContext),
    new TextboxController(projectContext),
    new EllipseController(projectContext),
    new PolygonController(projectContext),
    new ImageController(projectContext),
    new PointerController(projectContext),
    new GroupController(projectContext),
  ] as BaseShapeController<LevelEditorShape>[];
  const map: { [name: string]: BaseShapeController<LevelEditorShape> } = {};
  for (const element of list) {
    map[element.name] = element;
  }
  return {
    list,
    map,
  };
}
