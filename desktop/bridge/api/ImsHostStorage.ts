import { storageGetKey, storageSetKey } from "../../electron/storage";
import { ImsHostBase } from "./ImsHostBase";

export class ImsHostStorage extends ImsHostBase {
  setItem<T>(key: string, value: T | null): Promise<void>{
    return storageSetKey(key, value)
  }
  removeItem(key: string): Promise<void>{
    return storageSetKey(key, null)
  }
  getItem<T>(key: string): Promise<T | null>{
    return storageGetKey(key);
  }
}
