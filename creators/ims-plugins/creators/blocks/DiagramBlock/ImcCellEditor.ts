import type {
  mxCell,
  mxCellState,
  mxGraph,
  mxGraphExportObject,
} from 'mxgraph';
import type { ImcDiagramInterface } from './ImcDiagramInterface';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import { sameAssetPropValues } from '~ims-app-base/logic/types/Props';

export function createImcCellEditor(
  mx: mxGraphExportObject,
  graph: mxGraph,
  comp: ImcDiagramInterface,
) {
  class ImcCellEditor extends mx.mxCellEditor {
    comp: ImcDiagramInterface;

    constructor(graph: mxGraph, comp: ImcDiagramInterface) {
      super(graph);
      this.comp = comp;
    }

    override init() {
      if (!this.comp.$refs.cellEditor) {
        throw new Error('Component is not mounted');
      }
      this.textarea = this.comp.$refs.cellEditor;
      this.comp.editingCell = {
        value: '',
        state: null,
      };
    }

    override getInitialValue(state: mxCellState, trigger: MouseEvent): string {
      return this.graph.getEditingValue(state.cell, trigger as any);
    }

    override startEditing(
      cell: mxCell,
      trigger?: MouseEvent | undefined,
    ): void {
      this.stopEditing(true);
      (this as any).align = null;

      // Creates new textarea instance
      if (this.textarea == null) {
        this.init();
      }

      if (this.graph.tooltipHandler != null) {
        this.graph.tooltipHandler.hideTooltip();
      }

      const state = this.graph.getView().getState(cell);

      if (state != null) {
        // Configures the style of the in-place editor
        const _scale = this.graph.getView().scale;
        const size = mx.mxUtils.getValue(
          state.style,
          mx.mxConstants.STYLE_FONTSIZE,
          mx.mxConstants.DEFAULT_FONTSIZE,
        );
        const family = mx.mxUtils.getValue(
          state.style,
          mx.mxConstants.STYLE_FONTFAMILY,
          mx.mxConstants.DEFAULT_FONTFAMILY,
        );
        const color = mx.mxUtils.getValue(
          state.style,
          mx.mxConstants.STYLE_FONTCOLOR,
          'black',
        );
        const align = mx.mxUtils.getValue(
          state.style,
          mx.mxConstants.STYLE_ALIGN,
          mx.mxConstants.ALIGN_LEFT,
        );
        const bold =
          (mx.mxUtils.getValue(state.style, mx.mxConstants.STYLE_FONTSTYLE, 0) &
            mx.mxConstants.FONT_BOLD) ==
          mx.mxConstants.FONT_BOLD;
        const italic =
          (mx.mxUtils.getValue(state.style, mx.mxConstants.STYLE_FONTSTYLE, 0) &
            mx.mxConstants.FONT_ITALIC) ==
          mx.mxConstants.FONT_ITALIC;
        const txtDecor = [];

        if (
          (mx.mxUtils.getValue(state.style, mx.mxConstants.STYLE_FONTSTYLE, 0) &
            mx.mxConstants.FONT_UNDERLINE) ==
          mx.mxConstants.FONT_UNDERLINE
        ) {
          txtDecor.push('underline');
        }

        if (
          (mx.mxUtils.getValue(state.style, mx.mxConstants.STYLE_FONTSTYLE, 0) &
            mx.mxConstants.FONT_STRIKETHROUGH) ==
          mx.mxConstants.FONT_STRIKETHROUGH
        ) {
          txtDecor.push('line-through');
        }

        (this.textarea as HTMLElement).style.lineHeight = mx.mxConstants
          .ABSOLUTE_LINE_HEIGHT
          ? Math.round(size * mx.mxConstants.LINE_HEIGHT) + 'px'
          : (mx.mxConstants.LINE_HEIGHT as any);
        (this.textarea as HTMLElement).style.backgroundColor =
          this.getBackgroundColor(state);
        (this.textarea as HTMLElement).style.textDecoration =
          txtDecor.join(' ');
        (this.textarea as HTMLElement).style.fontWeight = bold
          ? 'bold'
          : 'normal';
        (this.textarea as HTMLElement).style.fontStyle = italic ? 'italic' : '';
        (this.textarea as HTMLElement).style.fontSize = Math.round(size) + 'px';
        (this.textarea as HTMLElement).style.zIndex = this.zIndex as any;
        (this.textarea as HTMLElement).style.fontFamily = family;
        (this.textarea as HTMLElement).style.textAlign = align;
        (this.textarea as HTMLElement).style.outline = 'none';
        (this.textarea as HTMLElement).style.color = color;

        // Update this after firing all potential events that could update the cleanOnChange flag
        this.editingCell = cell;
        (this.initialValue as any) =
          this.getInitialValue(state, trigger as any) || null;
        this.comp.editingCell = {
          value: this.initialValue,
          state,
        };

        if (state.text != null && this.isHideLabel(state)) {
          (this.textNode as any) = state.text.node;
          (this.textNode as any).style.visibility = 'hidden';
        }

        // Workaround for initial offsetHeight not ready for heading in markup
        if (
          this.autoSize &&
          (this.graph.model.isEdge(state.cell) ||
            state.style[mx.mxConstants.STYLE_OVERFLOW] != 'fill')
        ) {
          window.setTimeout(() => {
            this.resize();
          }, 0);
        }

        this.resize();

        setTimeout(() => {
          if (this.comp.$refs.cellEditorComp) {
            this.comp.$refs.cellEditorComp.selectAll();
          }
        }, 0);
      }
    }

    override prepareTextarea() {}

    override getCurrentValue(_state: mxCellState): any {
      return this.comp.editingCell ? this.comp.editingCell.value : null;
    }

    override stopEditing(cancel: boolean) {
      cancel = cancel || false;
      (async () => {
        if (this.editingCell != null) {
          if (this.textNode != null) {
            (this.textNode as any).style.visibility = 'visible';
            (this.textNode as any) = null;
          }

          const state = !cancel
            ? this.graph.view.getState(this.editingCell)
            : null;

          (this as any).editingCell = null;
          (this as any).trigger = null;
          (this as any).bounds = null;

          await this.comp.$getAppManager().get(UiManager).blurActiveElement();
          this.clearSelection();

          if (state != null) {
            const value = this.getCurrentValue(state);

            if (!sameAssetPropValues(this.initialValue, value)) {
              this.graph.getModel().beginUpdate();
              try {
                this.applyValue(state, value);
              } finally {
                this.graph.getModel().endUpdate();
              }
            }
          }

          this.comp.editingCell = null;
          (this as any).initialValue = null;

          // Forces new instance on next edit for undo history reset
          mx.mxEvent.release(this.textarea);
          (this as any).textarea = null;
          (this as any).align = null;
        }
      })();
    }

    override destroy() {
      if (this.textarea != null) {
        mx.mxEvent.release(this.textarea);
        (this.textarea as any) = null;
        this.comp.editingCell = null;
      }

      if ((this as any).changeHandler != null) {
        this.graph.getModel().removeListener((this as any).changeHandler);
        (this as any).changeHandler = null;
      }

      if ((this as any).zoomHandler) {
        this.graph.view.removeListener((this as any).zoomHandler);
        (this as any).zoomHandler = null;
      }
    }
  }

  return new ImcCellEditor(graph, comp);
}
