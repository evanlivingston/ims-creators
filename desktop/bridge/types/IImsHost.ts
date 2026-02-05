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

export interface IImsHostExposed {
  fs: ImsHostFs;
  shell: ImsHostShell;
  window: Omit<ImsHostWindow, '$setArgs'>;
  storage: ImsHostStorage;
  project: ImsHostProject;
  autoUpdate: ImsHostAutoUpdate;
  app: ImsHostApp
}
