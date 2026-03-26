import * as fabric from 'fabric';
import type { LevelEditorShape } from '../editor/LevelEditor';
import { v4 as uuidv4 } from 'uuid';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';
import { AssetSubContext } from '~ims-app-base/logic/project-sub-contexts/AssetSubContext';

export function shapeValueToString(value: LevelEditorShape['value']) {
  return typeof value === 'string' ? value : value?.Title;
}

export type DecorationLabelPosition = 'center' | 'top';
export type DecorationLabelBehavior = 'move-only' | 'move-and-transform';

const PADDING_Y = 5;
const PADDING_X = 10;
const BORDER_RADIUS = 5;
const BACKGROUND_FILL = '#EED811';

export const DEFAULT_LABEL_WIDTH = 125;

export default class DecorationLabel extends fabric.Group {
  static override type = 'label';

  public readonly targetObject!: fabric.FabricObject;

  private readonly _position: DecorationLabelPosition = 'center';
  private readonly _behavior: DecorationLabelBehavior = 'move-only';

  protected readonly projectContext: IProjectContext;

  readonly textbox: fabric.Textbox;
  readonly background: fabric.Rect | null = null;

  constructor(
    value: NonNullable<LevelEditorShape['value']>,
    fabric_object: fabric.FabricObject,
    projectContext: IProjectContext,
    options?: {
      position?: DecorationLabelPosition;
      behavior?: DecorationLabelBehavior;
      hasBackground?: boolean;
    },
  ) {
    const group_id = uuidv4();

    const textbox = new fabric.Textbox('', {
      fontSize: 14,
      fill: 'black',
      textAlign: 'center',
      fontFamily: 'Ubuntu',
      fontWeight: options?.hasBackground ? '500' : '400',
      originX: 'center',
      originY: 'center',
      width: DEFAULT_LABEL_WIDTH,
      selectable: false,
      evented: false,
    });

    let background: fabric.Rect | null = null;

    if (options?.hasBackground) {
      background = new fabric.Rect({
        originX: 'center',
        originY: 'center',
        fill: BACKGROUND_FILL,
        rx: BORDER_RADIUS,
        ry: BORDER_RADIUS,
        width: textbox.width + PADDING_X * 2,
        height: textbox.height + PADDING_Y * 2,
      });
    }

    const objects = background ? [background, textbox] : [textbox];

    super(objects, {
      id: group_id,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center',
    });

    this.projectContext = projectContext;
    this.textbox = textbox;
    this.background = background;

    this.targetObject = fabric_object;

    this.setValue(value);

    if (options?.position) this._position = options.position;
    if (options?.behavior) this._behavior = options.behavior;

    this.updatePosition();

    const updateTextPosition = (
      _e: fabric.BasicTransformEvent<fabric.TPointerEvent>,
    ) => {
      this.updatePosition();
    };

    fabric_object.set('decorationObject', this);

    // fabric_object.on('moving', updateTextPosition);
    // fabric_object.on('scaling', updateTextPosition);
    // fabric_object.on('rotating', updateTextPosition);
    // fabric_object.on('skewing', updateTextPosition);

    // // for correct work with selection
    // fabric_object.on('added', (e: { target: fabric.Group }) => {
    //   if (e.target.type === 'activeselection') {
    //     e.target.on('moving', updateTextPosition);
    //     e.target.on('scaling', updateTextPosition);
    //     e.target.on('rotating', updateTextPosition);
    //     e.target.on('skewing', updateTextPosition);
    //   }
    // });

    if (fabric_object.canvas) {
      fabric_object.canvas.on('object:moving', updateTextPosition);
      fabric_object.canvas.on('object:scaling', updateTextPosition);
      fabric_object.canvas.on('object:rotating', updateTextPosition);
      fabric_object.canvas.on('object:skewing', updateTextPosition);
    }
  }

  updatePosition() {
    if (this._behavior === 'move-and-transform') {
      this.angle = this.targetObject.angle;
      this.scaleX = this.targetObject.scaleX;
      this.scaleY = this.targetObject.scaleY;
      this.skewX = this.targetObject.skewX;
      this.skewY = this.targetObject.skewY;
      this.flipX = this.targetObject.flipX;
      this.flipY = this.targetObject.flipY;
    }

    const offset_x = 0;
    let offset_y = 0;

    if (this._position === 'top') {
      offset_y = -(this.targetObject.height / 2 + this.height / 2 + 5);
    }
    const offset = new fabric.Point(offset_x, offset_y);

    const target_matrix = this.targetObject.calcTransformMatrix(
      !!this.targetObject.parent,
    );

    const transformed_offset = offset.transform(target_matrix);
    this.left = transformed_offset.x;
    this.top = transformed_offset.y;
    this.setCoords();
  }

  setValue(new_val: LevelEditorShape['value']) {
    if (typeof new_val !== 'string' && new_val?.AssetId) {
      const cached_asset_short = this.projectContext
        .get(AssetSubContext)
        .getAssetShortViaCacheSync(new_val.AssetId);
      if (cached_asset_short === undefined) {
        this.projectContext
          .get(AssetSubContext)
          .requestAssetShortInCache(new_val.AssetId)
          .then(() => {
            // TODO: test
            const cached_asset = this.projectContext
              .get(AssetSubContext)
              .getAssetShortViaCacheSync(new_val.AssetId);
            if (cached_asset)
              this.textbox.set({
                text: cached_asset.title,
              });
          });
      } else if (
        cached_asset_short?.title &&
        new_val.Title !== cached_asset_short.title
      ) {
        new_val.Title = cached_asset_short?.title ?? '';
      }
    }

    const text = shapeValueToString(new_val) ?? '';
    this.textbox.set({
      text: text,
      width: DEFAULT_LABEL_WIDTH, // hack for adaptive width
    });

    this._updateBackgroundSize(this.textbox.width, this.textbox.height);

    const new_group_height = Math.max(
      this.textbox.height,
      this.background?.height ?? 0,
    );
    const new_group_width = Math.max(
      this.textbox.width,
      this.background?.width ?? 0,
    );

    this.set({
      height: new_group_height,
      width: new_group_width,
    });

    this.updatePosition();
  }

  private _updateBackgroundSize(width: number, height: number) {
    if (!this.background) return;
    const updates: Partial<fabric.RectProps> = {};
    if (this.background.width !== width) {
      updates.width = width + PADDING_X * 2;
    }
    if (this.background.height !== height) {
      updates.height = height + PADDING_Y * 2;
    }

    if (Object.keys(updates).length > 0) {
      this.background.set(updates);
      this.background.setCoords();
    }
  }
}
