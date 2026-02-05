import { BrowserWindow, ipcMain, type WebUtils } from 'electron';
import { ImsHostFs } from '#bridge/api/ImsHostFs';
import type { IImsHostApi } from '#bridge/types/IImsHost';
import { ImsHostShell } from '#bridge/api/ImsHostShell';
import { ImsHostWindow } from '#bridge/api/ImsHostWindow';
import { ImsHostStorage } from '#bridge/api/ImsHostStorage';
import { ImsHostProject } from '#bridge/api/ImsHostProject';
import { ImsHostApp } from '#bridge/api/ImsHostApp';
import log from 'electron-log/main';
import { ImsHostAutoUpdate } from '#bridge/api/ImsHostAutoUpdate';

const registeredWindows = new Map<BrowserWindow, IImsHostApi>();

function isEntryExposed(api: Record<string, unknown>, name: string){
  if (name === 'contructor') return false;
  if (name.startsWith('_') || name.startsWith('$')) return false;
  if (typeof(api[name]) !== 'function') return false;
  return true;
}

export function initImsHostApi() {
  ipcMain.handle(
    'imshost-call',
    async (event, api: string, method: string, args: any[]) => {
      try {
        const event_win = BrowserWindow.fromWebContents(event.sender);
        if (!event_win) throw new Error('Cannot retrieve window from event');
        const apiObj = registeredWindows.get(event_win) as
          | {
              [api: string]: {
                [method: string]: any;
              };
            }
          | undefined;
        if (!apiObj) throw new Error('Window is not registered');
        if (!apiObj[api]) throw new Error('Wrong api name');
        if (!isEntryExposed(apiObj[api], method)){
          throw new Error('Wrong api function name');
        }
        const result = await apiObj[api][method].apply(apiObj[api], args ?? [])
        return {
          result: result ?? null,
          error: null
        }
      }
      catch (err: any){
        log.error(err);
        return {
          result: null,
          error: err.message.toString(),
        }
      }
    },
  );
  ipcMain.handle('imshost-index', (event) => {
    const event_win = BrowserWindow.fromWebContents(event.sender);
    if (!event_win) throw new Error('Cannot retrieve window from event');
    const apiObj = registeredWindows.get(event_win) as
      | {
          [api: string]: { [method: string]: any };
        }
      | undefined;
    if (!apiObj) throw new Error('Window is not registered');

    return Object.fromEntries(
      [...Object.entries(apiObj)].map((entry) => {
        const methods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(entry[1]),
        ).filter(
          (name) => isEntryExposed(entry[1], name)
        );

        return [entry[0], methods];
      }),
    );
  });
}

export function registerImsHostWindow(win: BrowserWindow): IImsHostApi {
  const api: IImsHostApi =  {
    fs: new ImsHostFs(win),
    shell: new ImsHostShell(win),
    window: new ImsHostWindow(win),
    storage: new ImsHostStorage(win),
    project: new ImsHostProject(win),
    autoUpdate: new ImsHostAutoUpdate(win),
    app: new ImsHostApp(win)
  }
  registeredWindows.set(win, api);
  return api;
}

export function unregisterImsHostWindow(win: BrowserWindow) {
  registeredWindows.delete(win);
}
