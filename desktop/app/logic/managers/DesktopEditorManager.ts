import EditorSubContext, { type UploadingJob } from "~ims-app-base/logic/managers/EditorManager";
import { v4 as uuidv4 } from 'uuid';
import type { AssetPropValueFile } from "~ims-app-base/logic/types/Props";
import { assert } from "~ims-app-base/logic/utils/typeUtils";
import ProjectManager from "~ims-app-base/logic/managers/ProjectManager";
import { md5 } from 'hash-wasm';
import * as node_path from 'path';

export class DesktopEditorManager extends EditorSubContext{
   
  private readonly ATTACHMENTS_DIR = 'attachments';

  override attachFile(file: Blob | File, name: string): UploadingJob {
    let upload_resolve: ((res: AssetPropValueFile | null) => void) | undefined =
      undefined;
    let upload_reject: ((err: Error) => void) | undefined = undefined;
    const controller = new AbortController();
    const upload_promise = new Promise<AssetPropValueFile | null>(
      (res, rej) => {
        upload_resolve = res;
        upload_reject = rej;
      },
    );
    const uploadingJob: UploadingJob = {
      result: undefined,
      error: undefined,
      uploadId: uuidv4(),
      progress: 0,
      sentBytes: 0,
      totalBytes: file.size,
      title: name,
      awaitResult: () => upload_promise,
      cancel: () => {
        controller.abort();
        uploadingJob.result = null;
        assert(upload_resolve);
        upload_resolve(null);
      },
    };

    this._uploadingJobs.set(uploadingJob.uploadId, uploadingJob);

    const do_upload = async () => {
      try {
        const filePath = file instanceof File ? await window.imsGetPathForFile(file) : '';

        const relative_path = await this._checkFileLocationAndMoveIfNeed(name, filePath, file);
        const project_root = this.appManager.get(ProjectManager).getProjectInfo()?.localPath;
        if(!project_root){
          throw Error('Need project local path');
        }
        const result_path = node_path.join(project_root ?? '', relative_path);
        const result_file_hash = await md5(relative_path)
        const result_file_id = this._md5ToUuid(result_file_hash);
        const result_file_title = node_path.basename(result_path);

        const res_val: AssetPropValueFile = {
          FileId: result_file_id,
          Title: result_file_title,
          Dir: node_path.dirname(relative_path).replaceAll('\\', '//'),
          Size: file.size,
          Store: "loc-project",
        };

        uploadingJob.result = res_val;
        assert(upload_resolve);
        upload_resolve(res_val);
      } catch (err: any) {
        uploadingJob.error = err.message;
        assert(upload_reject);
        upload_reject(err);
      }
    };

    // Do not wait
    do_upload();
    return uploadingJob;
  }

  private async _checkFileLocationAndMoveIfNeed(fileName: string, filePath: string, fileBuffer: Blob){
    let project_root = (this.appManager.get(ProjectManager).getProjectInfo()?.localPath ?? '').replaceAll('\\', '/');
    if(!project_root){
      throw Error('Need project local path');
    }
    if (project_root[project_root.length - 1] !== '/'){
      project_root += '/'
    }
    fileName = fileName.replaceAll('\\', '/');
    const isInProject = filePath && filePath.startsWith(project_root);

    if (!isInProject) {
        return await this.saveToAttachments(fileBuffer, fileName);
    }
    return filePath.substring(project_root.length);
  }

  private _md5ToUuid(md5Hash: string): string {
    return md5Hash.replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5'
    );
  }


  private async saveToAttachments(file: Blob, fileName: string): Promise<string> {
    const file_buffer = await file.arrayBuffer();
    const file_array = new Uint8Array(file_buffer)
    
    const file_hash = await window.imshost.fs.hashValue(file_array);
    const ext = node_path.extname(fileName);
    const base_name = node_path.basename(fileName, ext);

    let counter = 0;
    while (true) {
        const current_name = counter === 0 ? fileName : `${base_name} (${counter})${ext}`;
        const project_root = this.appManager.get(ProjectManager).getProjectInfo()?.localPath;
        const attachment_path = node_path.join(project_root ?? '', this.ATTACHMENTS_DIR, current_name);

        try {
            const file_info = await window.imshost.fs.stat(attachment_path);
            const existing_hash = await window.imshost.fs.hashFile(attachment_path);

            if (file_info.size === file_array.length && existing_hash === file_hash) {
                return node_path.join(this.ATTACHMENTS_DIR, current_name);
            }
        } catch (error: any) {
            if(/^ENOENT: no such file or directory.*/.test(error.message) ||
              /^Files has different$/.test(error.message)
            ){
              // Файл не существует - сохраняем
              const dir = node_path.dirname(attachment_path);
              await window.imshost.fs.mkDir(dir, true);
              await window.imshost.fs.writeFile(attachment_path, file_array);
              return node_path.join(this.ATTACHMENTS_DIR, current_name);
            }
            else {
              throw new Error(error.message);
            }
        }

        counter++;
    }
  }
}