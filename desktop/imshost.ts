import type { UpdateNewVersion } from '#logic/managers/DesktopUpdateManager';
import type { IImsHostExposed } from './bridge/types/IImsHost';

declare global {
  interface Window {
    imshost: IImsHostExposed;
    loadImshost: () => Promise<void>;
    imsGetPathForFile: (file: File) => Promise<string>;
    requestNewVersionAvailable: (func: (version: UpdateNewVersion | null) => void) => void;
  }
}
