import ProjectContentManager from '~ims-app-base/logic/managers/ProjectContentManager';

export default class WebProjectContentManager extends ProjectContentManager {
  override async saveWithCustomFormat(file: { content: Blob; name: string }) {
    const url = URL.createObjectURL(file.content);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
