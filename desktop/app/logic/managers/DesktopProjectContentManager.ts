import ProjectContentManager from "../../../../ims-app-base/app/logic/project-sub-contexts/ImportExportSubContext";

export default class DesktopProjectContentManager extends ProjectContentManager{
    override async saveWithCustomFormat(file: {
      content: Blob;
      name: string;
  }) {
        const save_dialog_res = await window.imshost.fs.showSaveFileDialog({
            defaultPath: file.name
        })
        if (save_dialog_res.canceled){
            return;
        }
        else {
            const file_buffer = await file.content.arrayBuffer();
            const file_array = new Uint8Array(file_buffer)
            await window.imshost.fs.writeFile(save_dialog_res.filePath,file_array);
        }
    }
}