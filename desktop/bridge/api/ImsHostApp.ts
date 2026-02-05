import { ImsHostBase } from './ImsHostBase';
import { app } from 'electron'
import { storageGetKey, storageSetKey } from "../../electron/storage";

export class ImsHostApp extends ImsHostBase{
  private _currentLanguage: string | undefined;
    
  async getLanguage(): Promise<string> {
    if (this._currentLanguage === undefined){
        this._currentLanguage = await storageGetKey('lang') ?? undefined;
        if (!this._currentLanguage){
            this._currentLanguage = 'en';
            const system_locale = app.getLocale();
            if (/^ru/i.test(system_locale)) this._currentLanguage = 'ru';
        }
    }
    return this._currentLanguage;
  }

  async setLanguage(lang: string) {
    switch (lang) {
        case 'ru':
        case 'en':
            break;
        default:
            lang = 'en';
            break;
    }
    await storageSetKey('lang', lang);
    this._currentLanguage = lang;
  }
}
