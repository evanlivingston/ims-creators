import * as fabric from 'fabric';

export class LevelGroupLayoutStrategy extends fabric.FitContentLayout {
  override calcLayoutResult(
    context: fabric.StrictLayoutContext,
    objects: fabric.FabricObject[],
  ): fabric.LayoutStrategyResult | undefined {
    return super.calcLayoutResult(
      context,
      objects.filter((obj) => obj.type !== 'label'),
    );
  }
}
