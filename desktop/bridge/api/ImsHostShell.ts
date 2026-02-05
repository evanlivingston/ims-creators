import { ImsHostBase } from './ImsHostBase';
import { launch } from '../../electron/shell-utils';
import { shell, app } from 'electron'
import path from 'node:path';
import { APP_FOLDER_NAME } from '../constants';

export class ImsHostShell extends ImsHostBase{
  async showFolder(path: string): Promise<void> {
    await launch(path);
  }
  async showItemInFolder(path: string): Promise<void> {
      shell.showItemInFolder(path);
  }
  
  async getUserDataFolder(){
      return path.join(app.getPath('appData'), APP_FOLDER_NAME);
  }

  async getTempFolder(){
      return path.join(app.getPath('temp'), APP_FOLDER_NAME);
  }

  async getDownloadFolder(){
      return app.getPath('downloads');
  }
  
  async getExePath(){
      return app.getPath('exe');
  }
  
  async getDocumentsFolder(){
      return app.getPath('documents');
  }
}
