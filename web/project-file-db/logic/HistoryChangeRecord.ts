import { v4 as uuidv4 } from 'uuid';
import type { AssetSetDTO } from '~ims-app-base/logic/types/AssetsType';

export type HistoryChange = {
    assetId: string,
    undo: AssetSetDTO
}

export class HistoryChangeRecord{

    changeId: string
    changes: HistoryChange[] = []

    constructor(id?: string){
        this.changeId = id ? id : uuidv4();
    }

    addChange(asset_id: string, undo: AssetSetDTO){
        this.changes.push({
            assetId: asset_id,
            undo
        })
    }
}