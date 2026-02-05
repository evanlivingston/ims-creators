
import { app } from 'electron';
import path from "path";
import crypto from 'crypto';
import fsPromises from 'fs/promises';
import log from 'electron-log/main';
import { APP_FOLDER_NAME } from '#bridge/constants';

const CIPHER_ALGO = 'aes-256-ctr';
const SALT = " - IMS CREATORS DESKTOP: PLEASE, DO NOT HACK ME! - "
const SALT_BUF_SIZE = 32;
const IV_SIZE = 16

const storage_folder = path.join(app.getPath('appData'), APP_FOLDER_NAME, 'storage');

type PrivateStorage = {
    data: Record<string, any>,
    accountId: string
}

let CurrentPrivateStorage: PrivateStorage | null = null;

function getRandomBytes(count: number){
    return new Promise<Buffer>((res, rej) => {
        crypto.randomBytes(count, (err, buf) => {
            if (err) rej(err);
            else res(buf)
        });
    })
}


async function loadPrivateStorage(account_id: string){
    if (!CurrentPrivateStorage || CurrentPrivateStorage.accountId != account_id){
        let data = {};
        let private_data_buf = null;
        try{
            private_data_buf= await fsPromises.readFile(path.join(storage_folder, `private-${account_id}.dat`));
        }
        catch (err){
            // ignore error
        }
        if (private_data_buf){
            try{
                const salt_buf = private_data_buf.subarray(0, SALT_BUF_SIZE);
                const iv_buf = private_data_buf.subarray(SALT_BUF_SIZE, SALT_BUF_SIZE + IV_SIZE);
                const data_buf = private_data_buf.subarray(SALT_BUF_SIZE + IV_SIZE);
                const pre_key = Buffer.concat([
                    salt_buf,
                    Buffer.from(account_id + SALT + account_id, 'utf8')
                ]);
                const key = crypto.createHash('sha256').update(pre_key).digest()

                const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, iv_buf);
                const decrpyted_str = Buffer.concat([decipher.update(data_buf), decipher.final()]).toString('utf8');
                data = JSON.parse(decrpyted_str);
            }
            catch (err){
                log.error(err);
            }
        }

        CurrentPrivateStorage = {
            accountId: account_id,
            data
        }
    }

    return CurrentPrivateStorage;
}

async function savePrivateStorage(storage: PrivateStorage){
    const salt_buf = await getRandomBytes(SALT_BUF_SIZE);
    const pre_key = Buffer.concat([
        salt_buf,
        Buffer.from(storage.accountId + SALT + storage.accountId, 'utf8')
    ]);
    const key = crypto.createHash('sha256').update(pre_key).digest()

    const iv = await getRandomBytes(IV_SIZE);
    const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);

    const data_str = JSON.stringify(storage.data)
    const encrypted = Buffer.concat([
        salt_buf,
        iv,
        cipher.update(Buffer.from(data_str, 'utf8')),
        cipher.final()
    ]);

    await fsPromises.writeFile(path.join(storage_folder, `private-${storage.accountId}.dat`), encrypted)
}

export async function privateStorageGetKey<T>(account_id: string, key: string): Promise<T>{
    const storage = await loadPrivateStorage(account_id);
    return storage.data[key] ?? null;
}

export async function privateStorageSetKey<T>(account_id: string, key: string, value: T){
    const storage = await loadPrivateStorage(account_id);
    storage.data[key] = value;
    await savePrivateStorage(storage);
}
export async function privateStorageDeleteKey(account_id: string, key: string){
    const storage = await loadPrivateStorage(account_id);
    if (storage.data.hasOwnProperty(key)){
        delete storage.data[key];
        await savePrivateStorage(storage);
    }
}