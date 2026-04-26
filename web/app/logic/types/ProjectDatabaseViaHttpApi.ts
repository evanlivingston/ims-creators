import type { AssetHistoryDTO } from '~ims-app-base/logic/types/AssetHistory';
import type {
  AssetQueryWhere,
  AssetsShortResult,
  AssetsFullResult,
  AssetsGraph,
  AssetCreateDTO,
  AssetWhereParams,
  AssetDeleteResultDTO,
  CreateRefDTO,
  AssetReferencesResult,
  AssetChangeDTO,
  AssetsChangeResult,
  AssetMoveParams,
  AssetMoveResult,
  AssetChangeBatchOpDTO,
  AssetsBatchChangeResultDTO,
} from '~ims-app-base/logic/types/AssetsType';
import type {
  IProjectDatabase,
  IProjectDatabaseEventHandler,
  ProjectContentChangeEventArg,
} from '~ims-app-base/logic/types/IProjectDatabase';
import type {
  ApiRequestList,
  ApiResultListWithMore,
  ApiResultListWithTotal,
} from '~ims-app-base/logic/types/ProjectTypes';
import type { AssetProps, AssetPropsPlainObject } from '~ims-app-base/logic/types/Props';
import type { AssetPropsSelection } from '~ims-app-base/logic/types/PropsSelection';
import type {
  ChangeWorkspaceRequest,
  Workspace,
  WorkspaceMoveParams,
  WorkspaceMoveResult,
  WorkspaceQueryDTOWhere,
} from '~ims-app-base/logic/types/Workspaces';

export class ProjectDatabaseViaHttpApi implements IProjectDatabase {
  assetsGetShort(
    query: ApiRequestList<AssetQueryWhere>,
  ): Promise<AssetsShortResult> {
    return $fetch('/api/project/assets/get-short', { method: 'POST', body: query });
  }

  assetsGetFull(
    query: ApiRequestList<AssetQueryWhere>,
  ): Promise<AssetsFullResult> {
    return $fetch('/api/project/assets/get-full', { method: 'POST', body: query });
  }

  assetsGetView<T extends AssetProps>(
    query: AssetPropsSelection,
    options?: { folded: false },
  ): Promise<ApiResultListWithTotal<T>>;
  assetsGetView<T extends AssetPropsPlainObject>(
    query: AssetPropsSelection,
    options: { folded: true } | { folded: boolean },
  ): Promise<ApiResultListWithTotal<T>>;
  assetsGetView<T extends AssetPropsPlainObject>(
    query: AssetPropsSelection,
    options?: { folded: boolean },
  ): Promise<ApiResultListWithTotal<T>> {
    return $fetch('/api/project/assets/get-view', {
      method: 'POST',
      body: { query, options },
    });
  }

  assetsGraph(query: ApiRequestList<AssetQueryWhere>): Promise<AssetsGraph> {
    return $fetch('/api/project/assets/graph', { method: 'POST', body: query });
  }

  assetsCreate(params: AssetCreateDTO): Promise<AssetsChangeResult> {
    return $fetch('/api/project/assets/create', { method: 'POST', body: params });
  }

  assetsChange(
    params: AssetChangeDTO,
    options?: { pid?: string },
  ): Promise<AssetsChangeResult> {
    return $fetch('/api/project/assets/change', {
      method: 'POST',
      body: { params, options },
    });
  }

  assetsChangeUndo(
    params: { changeId: string },
    options?: { pid?: string },
  ): Promise<AssetsChangeResult> {
    return $fetch('/api/project/assets/change-undo', {
      method: 'POST',
      body: { params, options },
    });
  }

  assetsChangeBatch(
    params: { ops: AssetChangeBatchOpDTO[] },
    options?: { pid?: string },
  ): Promise<AssetsBatchChangeResultDTO> {
    return $fetch('/api/project/assets/change-batch', {
      method: 'POST',
      body: { params, options },
    });
  }

  assetsDelete(
    where: AssetWhereParams,
    options?: { pid?: string },
  ): Promise<AssetDeleteResultDTO> {
    return $fetch('/api/project/assets/delete', {
      method: 'POST',
      body: { where, options },
    });
  }

  assetsRestore(
    where: AssetWhereParams,
    options?: { pid?: string },
  ): Promise<AssetsChangeResult> {
    return $fetch('/api/project/assets/restore', {
      method: 'POST',
      body: { where, options },
    });
  }

  assetsCreateRef(params: CreateRefDTO): Promise<AssetReferencesResult> {
    return $fetch('/api/project/assets/create-ref', { method: 'POST', body: params });
  }

  assetsDeleteRef(params: CreateRefDTO): Promise<{ ids: string[] }> {
    return $fetch('/api/project/assets/delete-ref', { method: 'POST', body: params });
  }

  assetsMove(params: AssetMoveParams): Promise<AssetMoveResult> {
    return $fetch('/api/project/assets/move', { method: 'POST', body: params });
  }

  assetsGetHistory(
    assetId: string,
  ): Promise<ApiResultListWithMore<AssetHistoryDTO>> {
    return $fetch('/api/project/assets/get-history', {
      method: 'POST',
      body: { assetId },
    });
  }

  async getAssetLocalPath(_asset_id: string): Promise<string | null> {
    return null;
  }

  async getWorkspaceLocalPath(_workspace_id: string): Promise<string | null> {
    return null;
  }

  workspacesGet(
    query: ApiRequestList<WorkspaceQueryDTOWhere>,
  ): Promise<ApiResultListWithTotal<Workspace>> {
    return $fetch('/api/project/workspaces/get', { method: 'POST', body: query });
  }

  workspacesCreate(params: ChangeWorkspaceRequest): Promise<Workspace> {
    return $fetch('/api/project/workspaces/create', { method: 'POST', body: params });
  }

  workspacesChange(
    workspace_id: string,
    params: ChangeWorkspaceRequest,
  ): Promise<Workspace> {
    return $fetch('/api/project/workspaces/change', {
      method: 'POST',
      body: { workspaceId: workspace_id, params },
    });
  }

  workspacesDelete(workspace_id: string): Promise<void> {
    return $fetch('/api/project/workspaces/delete', {
      method: 'POST',
      body: { workspaceId: workspace_id },
    });
  }

  workspacesMove(params: WorkspaceMoveParams): Promise<WorkspaceMoveResult> {
    return $fetch('/api/project/workspaces/move', { method: 'POST', body: params });
  }

  subscribeEvents(
    _pid: string,
    _callback: (changes: ProjectContentChangeEventArg) => void,
  ): IProjectDatabaseEventHandler {
    return {
      cancel: () => {},
      isConnected: () => false,
      listenContent: () => {},
      listenComment: () => ({ cancel: () => {} }),
    };
  }
}
