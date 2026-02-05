import storage from "electron-json-storage";

// @ts-ignore 
import storage_utils from 'electron-json-storage/lib/utils';

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { APP_FOLDER_NAME } from "#bridge/constants";

const user_data_folder = path.join(app.getPath('appData'), APP_FOLDER_NAME);

storage.setDataPath(path.join(user_data_folder, 'storage'));

export function storageSetKeySync<T>(key: string, value: T | null){
    const file_name = storage_utils.getFileName(key);
    fs.writeFileSync(file_name, JSON.stringify(value));
}

export function storageGetKey<T>(key: string): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
        storage.has(key, (err, has) => {
            if (err) reject(err);
            if (has){
                storage.get(key, (err, data) => {
                    if (err)  reject(err);
                    else resolve(data as T);
                })
            }
            else {
                resolve(null);
            }
        });
    })
}

export function storageGetKeySync<T>(key: string): T | null {
    return (storage.getSync(key) ?? null) as T | null;
}


export async function storageSetKey<T>(key: string, value: T | null): Promise<void> {
    if (value === undefined){
        value = null;
    }
    try{
        if (value === null){
            await new Promise<void>((resolve, reject) => {
                storage.remove(key, function(error) {
                    if (error) reject(error);
                    else resolve()
                });

            });
        }
        else {
          await new Promise<void>((resolve, reject) => {
                storage.set(key, value, (err) => {
                    if (err) reject(err);
                    else resolve();
                })
            })
        }
    }
    catch (err){
        // Attempt 2
        storageSetKeySync(key, value)
    }
}
