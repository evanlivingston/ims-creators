export type SyncItem = {
    id: string,
    title: string,
    need_sync: string,
    synced_at: string,
    conflict: string,
    conflict_message: string,
}
export type SyncInfo = {
    inProcess: boolean,
    onPause: boolean,
    syncEnd: string | null,
    syncState: string | null,
    error: string | null,
    assets: SyncItem[],
    workspaces: SyncItem[],
}