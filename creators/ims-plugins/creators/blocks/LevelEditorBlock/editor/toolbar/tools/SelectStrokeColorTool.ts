import EditShapeColorTool from './base/EditShapeColorTool';

export default class SelectStrokeColorTool extends EditShapeColorTool {
  name = 'strokeColor';
  icon = null;
  override editProp = 'stroke';
}
