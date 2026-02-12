import type { ImsHostAutoUpdate } from '../api/ImsHostAutoUpdate';
import type { ImsHostFs } from '../api/ImsHostFs';
import type { ImsHostProject } from '../api/ImsHostProject';
import type { ImsHostShell } from '../api/ImsHostShell';
import type { ImsHostStorage } from '../api/ImsHostStorage';
import type { ImsHostWindow } from '../api/ImsHostWindow';
import type { ImsHostApp } from '../api/ImsHostApp';

export interface IImsHostApi  {
  fs: ImsHostFs;
  shell: ImsHostShell;
  window: ImsHostWindow;
  storage: ImsHostStorage;
  project: ImsHostProject;
  autoUpdate: ImsHostAutoUpdate;
  app: ImsHostApp
}

// Automatically exclude $ or _ prefixed methods in imshost apis
export type IImsHostExposed = {
  [Key in keyof IImsHostApi]: {
    [Method in Exclude<keyof IImsHostApi[Key], `\$${string}` | `_${string}`>]: IImsHostApi[Key][Method]
  }
}