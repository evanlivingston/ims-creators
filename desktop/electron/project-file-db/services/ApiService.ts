import axios, { type AxiosRequestConfig } from "axios";
import { ApiWorker, type IApiTokenStorage, Service, type HttpRequestParams, HttpMethods, type AuthTokenInfo } from "~ims-app-base/logic/managers/ApiWorker";
import type { ProjectFileDb } from "../ProjectFileDb";
import { assert } from '~ims-app-base/logic/utils/typeUtils';

export class ApiService {
  protected _apiWorker: ApiWorker | null = null;

  constructor(public db: ProjectFileDb){

  }

  async init(tokenStorage: IApiTokenStorage) {
    const services = {
      [Service.LEGACY_API]: '',
      [Service.AUTH]: process.env.AUTH_API_HOST ?? '/',
      [Service.CREATORS]: process.env.CREATORS_API_HOST ?? '/',
      [Service.FILE_STORAGE]: process.env.FILE_STORAGE_API_HOST ?? '/',
      [Service.SUPERVISOR]: '',
      [Service.GAME_MANAGER]: '',
      [Service.SPACE]: '',
      
    };

    this._apiWorker = new ApiWorker(
      tokenStorage,

      '',
      (request: HttpRequestParams) => {
        const base_url = services[request.service];
        if (!base_url) throw new Error('Unknown service: ' + request.service);

        const onUploadProgress = request.onUploadProgress;
        const axiosParams: AxiosRequestConfig = {
          method: request.method,
          url: base_url + request.endpoint,
          data: request.data,
          params: request.params,
          headers: request.headers,
          responseType: request.responseType,
          validateStatus: () => true,
          onUploadProgress: onUploadProgress
            ? (p) => onUploadProgress(p)
            : undefined,
        };
        return axios(axiosParams);
      },
    );
  }

  setCurrentProjectId(project_id: string | null) {
    assert(this._apiWorker, 'ApiWorker was not inited');
    this._apiWorker.setCurrentProjectId(project_id);
  }

  getCurrentProjectId() {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.getCurrentProjectId();
  }

  async call<T>(
    service: Service,
    method: HttpMethods,
    endpoint: string,
    params: any = null,
    paramsQuery: any = null,
  ): Promise<T> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return await this._apiWorker.call<T>(
      service,
      method,
      endpoint,
      params,
      paramsQuery,
    );
  }

  async upload<T>(
    service: Service,
    method: HttpMethods,
    endpoint: string,
    params: any,
    progressCallback?: (percent: number) => void,
  ): Promise<T> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.upload(
      service,
      method,
      endpoint,
      params,
      progressCallback,
    );
  }

  async download(
    service: Service,
    method: HttpMethods,
    endpoint: string,
    params?: any,
  ): Promise<ArrayBuffer> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.download(service, method, endpoint, params);
  }
  
  async getRefreshToken(): Promise<string | undefined> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.getRefreshToken();
  }

  async setToken(
    token: string | undefined,
    refreshToken: string | undefined,
    remember: boolean,
  ) {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.setToken(token, refreshToken, remember);
  }

  async forceRefreshToken(): Promise<boolean> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.forceRefreshToken();
  }

  async removeToken() {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.removeToken();
  }

  getTokenInfo(): AuthTokenInfo | undefined {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.getTokenInfo();
  }

  async ensureValidTokenInfo(): Promise<AuthTokenInfo | undefined> {
    assert(this._apiWorker, 'ApiWorker was not inited');
    return this._apiWorker.ensureValidTokenInfo();
  }
}
