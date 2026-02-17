import type { UpdateNewVersion } from '#logic/types/AutoUpdateTypes';
import type { IApiTokenStorage } from '~ims-app-base/logic/managers/ApiWorker';
import type { IImsHostExposed } from './bridge/types/IImsHost';

declare global {
  interface Window {
    imshost: IImsHostExposed;
    imshostOnCallbackCall: (id: number, callback: (...args: any[]) => Promise<any>) => (() => void)
    imshostSendEvent: (id: number, args: any) => void,
    loadImshost: () => Promise<void>;
    imsGetPathForFile: (file: File) => Promise<string>;
    requestNewVersionAvailable: (func: (version: UpdateNewVersion | null) => void) => void;
    imsToken: IApiTokenStorage
  }
}
