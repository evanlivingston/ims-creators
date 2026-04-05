import type { Component } from 'vue';
import type LevelEditorCanvasController from '../../../LevelEditorCanvasController';
import type { ToolSection } from '../../ToolManager';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export default abstract class Tool {
  abstract readonly name: string;
  abstract readonly icon?: string | null;
  abstract component: () => Promise<Component>;
  componentProps?: Record<string, any>;
  public readonly = false;
  readonly exclusiveGroup?: string;
  readonly isDefaultInGroup?: boolean = false;
  hideWhenDisabled: boolean = false;

  abstract section: ToolSection;

  protected _onDeactivateCallback: (() => void) | null = null;
  protected readonly projectContext: IProjectContext;

  readonly controller: LevelEditorCanvasController;

  constructor(
    projectContext: IProjectContext,
    controller: LevelEditorCanvasController,
  ) {
    this.controller = controller;
    this.projectContext = projectContext;
  }

  init() {}

  activate(onDeactivate?: () => void) {
    this._onDeactivateCallback = onDeactivate ?? null;
    this.onActivate();
  }

  deactivate() {
    if (this._onDeactivateCallback) this._onDeactivateCallback();
    this.onDeactivate();
  }

  onDeactivate() {}
  onActivate() {}
  onInit() {}

  isDisabled() {
    return false;
  }

  isLoading() {
    return false;
  }
}
