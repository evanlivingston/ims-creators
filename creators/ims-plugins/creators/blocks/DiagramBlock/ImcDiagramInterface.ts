import type { mxCellState } from 'mxgraph';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import type { AssetPropValue } from '~ims-app-base/logic/types/Props';

export interface ImcDiagramInterface {
  $refs: {
    container: HTMLElement | null;
    toolbar: HTMLElement | null;
    cellEditor: HTMLElement | null;
    cellEditorComp: any;
  };
  $el: HTMLElement | null;
  get isMobile(): boolean;
  editingCell: null | { value: AssetPropValue; state: mxCellState | null };
  $getAppManager: () => IAppManager;
  updateLabel(
    id: string,
    element: HTMLElement | null,
    value: AssetPropValue,
    state: mxCellState | null,
  ): void;
  onSelectionChange(): void;
}
