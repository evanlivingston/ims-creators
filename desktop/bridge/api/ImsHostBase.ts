import type { BrowserWindow } from 'electron';

export abstract class ImsHostBase {
  protected _window: BrowserWindow;
  constructor(win: BrowserWindow) {
    this._window = win;
  }
}
