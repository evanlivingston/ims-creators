import { privateStorageSetKey, privateStorageDeleteKey, privateStorageGetKey } from "../../electron/private-storage";
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

  setPrivateItem<T>(account_id: string, key: string, value: T): Promise<void>{
    return privateStorageSetKey<T>(account_id, key, value)
  }
  removePrivateItem(account_id: string, key: string): Promise<void>{
    return privateStorageDeleteKey(account_id, key)
  }
  getPrivateItem<T>(account_id: string, key: string): Promise<T | null>{
    return privateStorageGetKey(account_id, key);
  }
}
