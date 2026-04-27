import EditorManager, { type UploadingJob } from '~ims-app-base/logic/managers/EditorManager';
import type { AssetPropValueFile } from '~ims-app-base/logic/types/Props';

export default class WebEditorManager extends EditorManager {
  attachFile(file: Blob, name: string): UploadingJob {
    let _result: AssetPropValueFile | null | undefined = undefined;
    let _error: string | undefined = undefined;
    let _progress = 0;
    let _cancelled = false;

    const resultPromise = (async (): Promise<AssetPropValueFile | null> => {
      try {
        const formData = new FormData();
        formData.append('file', file, name);

        const response = await $fetch<AssetPropValueFile>('/api/file/upload', {
          method: 'POST',
          body: formData,
        });

        if (_cancelled) return null;
        _result = response;
        _progress = 1;
        return response;
      } catch (err: any) {
        _error = err.message || 'Upload failed';
        _result = null;
        return null;
      }
    })();

    return {
      get result() { return _result; },
      get error() { return _error; },
      uploadId: Math.random().toString(36).slice(2),
      get progress() { return _progress; },
      sentBytes: 0,
      totalBytes: file.size,
      title: name,
      cancel() { _cancelled = true; },
      awaitResult() { return resultPromise; },
    };
  }
}
