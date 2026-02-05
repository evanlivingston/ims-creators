
export enum UpdateStatus {
  NONE = '',
  AVAILABLE = 'newVersionAvailable',
  DOWNLOADING = 'downloadingUpdateFile',
  DOWNLOAD_ERROR = 'autoUpdateError',
  DOWNLOADED = 'updateDownloaded',
}

export type UpdateNewVersionFile = {
  size?: number;
  url: string;
  sha512: string;
};

export type UpdateNewVersion = {
  version: string;
  path: string;
  files: UpdateNewVersionFile[];
};