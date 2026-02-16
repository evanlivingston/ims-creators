import PluginControllerBase, { type PluginContentDescriptorBase } from '~ims-app-base/logic/managers/Plugin/PluginControllerBase';
import type { IAppManager } from '../../../../../ims-app-base/app/logic/managers/IAppManager';
import * as node_path from 'path';
import ExternalPluginBlockTypeDefinition from '../../../../../ims-app-base/app/logic/types/ExternalPluginBlockTypeDefinition';

export default class PluginControllerProd extends PluginControllerBase {
  protected _pluginPath: string;

  constructor(appManager: IAppManager, plugin_path: string) {
    super(appManager);
    this._pluginPath = plugin_path;
  }

  override async load(): Promise<void> {
      const items = await window.imshost.plugin.readPluginDir(this._pluginPath);
      const manifest_entry = items.find(el => el.name === 'manifest.json');
      if (!manifest_entry) {
        throw new Error(`Cannot find manifest.json in ${this._pluginPath}`);
      }
  
      try {
        const manifest_path = node_path.join(manifest_entry.parentPath, manifest_entry.name)
        const parsed_manifest = JSON.parse(await window.imshost.fs.readTextFile(manifest_path));
  
        const parsed_manifest_content: PluginContentDescriptorBase<any, any>[] = []
        
        if (Array.isArray(parsed_manifest.content)) {
          for (const content_item of parsed_manifest.content) {
            switch (content_item.type) {
              case 'block': {
                const component_content_string = await window.imshost.fs.readTextFile(node_path.join(this._pluginPath, content_item.component));
                // const component_controller_string = await window.imshost.fs.readTextFile(node_path.join(this._pluginPath, content_item.controller));
  
                const definition = new (class extends ExternalPluginBlockTypeDefinition {
                  override name = content_item.name;
                  override icon = content_item.icon;
                  override resizableBlockHeight = content_item.resizableBlockHeight;
                  constructor(component: string) {
                    super(component);
                  }
                })(component_content_string);
                
                parsed_manifest_content.push({
                  type: "block",
                  content: {
                    definition,
                  }
                });
                break;
              };
              case 'module': {
                const code = await window.imshost.fs.readTextFile(node_path.join(this._pluginPath, content_item.code));
                parsed_manifest_content.push({
                  type: 'module',
                  content: {
                    async activate() {
                      const AsyncFunction = Object.getPrototypeOf(
                        async function () {},
                      ).constructor;
                      const func = new AsyncFunction('onDeactivated', code);
                      let deactivate_cb = () => {};
                      await func((callback: () => void) => deactivate_cb = callback);
                      return deactivate_cb;
                    }
                  }
                });
                break;
              };
            }
          }
        }
        if (parsed_manifest.icon) {
          const icon_path = node_path.join(this._pluginPath, parsed_manifest.icon);
          const icon_buffer = await window.imshost.fs.readFile(icon_path);
          parsed_manifest.icon = "data:application/octet-stream;base64," + Buffer.from(icon_buffer).toString('base64');
        }
        this._pluginDescriptor = {
          ...parsed_manifest,
          content: [
            ...parsed_manifest_content
          ]
        }
      }
      catch (err: any) {
        throw new Error(`Parse manifest.json failed in ${this._pluginPath}`);
      }
    }
}