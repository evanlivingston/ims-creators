import EditShapeColorTool from './base/EditShapeColorTool';

export default class SelectFillColorTool extends EditShapeColorTool {
  name = 'fillColor';
  icon = null;
  override editProp = 'fill';
}
