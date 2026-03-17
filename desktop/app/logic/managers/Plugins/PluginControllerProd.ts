import PluginControllerBase, { convertTranslatedPluginTitle, type PluginContentDescriptorBase, type PluginDescriptorLocale } from '~ims-app-base/logic/managers/Plugin/PluginControllerBase';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import * as node_path from 'path';
import ExternalPluginBlockTypeDefinition from '~ims-app-base/logic/types/ExternalPluginBlockTypeDefinition';
import PluginControllerExternal, { type PublicPluginApi } from '~ims-app-base/logic/managers/Plugin/PluginControllerExternal';
import { DefaultBlockEditorController, type BlockEditorController } from '~ims-app-base/logic/types/BlockEditorController';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import ExternalPluginBlockEditorController, { type ExternalPluginBlockControllerDescriptor, type GetPluginBlockController } from '~ims-app-base/logic/types/ExternalPluginBlockEditorController';

async function parsePluginLocale(plugin_path: string, locale_paths: Record<string, any>) {
  const plugin_locales: PluginDescriptorLocale = {};

  for (const [lang_key, lang_path] of Object.entries(locale_paths)) {
    const locale_path = node_path.join(plugin_path, lang_path);
    const locales = JSON.parse(await window.imshost.fs.readTextFile(locale_path));
    plugin_locales[lang_key] = locales;
  }

  return plugin_locales;
}



export default class PluginControllerProd extends PluginControllerExternal {
  protected _pluginPath: string;

  constructor(appManager: IAppManager, plugin_path: string) {
    super(appManager);
    this._pluginPath = plugin_path;
  }

  getPublicPluginApi(): PublicPluginApi {
    return {
      $t: (key: string) => {
        return convertTranslatedPluginTitle(key, this.appManager, this._pluginDescriptor?.locale ?? null)
      },
    };
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

        if (parsed_manifest.icon) {
          const icon_path = node_path.join(this._pluginPath, parsed_manifest.icon);
          const icon_buffer = await window.imshost.fs.readFile(icon_path);
          parsed_manifest.icon = "data:application/octet-stream;base64," + Buffer.from(icon_buffer).toString('base64');
        }

        let plugin_locale: PluginDescriptorLocale | null = null;
        if (parsed_manifest.locale) {
          plugin_locale = await parsePluginLocale(this._pluginPath, parsed_manifest.locale);
          parsed_manifest.locale = plugin_locale;
        }
  
        const parsed_manifest_content: PluginContentDescriptorBase<any, any>[] = []
        
        if (Array.isArray(parsed_manifest.content)) {
          for (const content_item of parsed_manifest.content) {
            switch (content_item.type) {
              case 'block': {
                const component_content_string = await window.imshost.fs.readTextFile(node_path.join(this._pluginPath, content_item.component));
                const component_controller_string = content_item.controller ? await window.imshost.fs.readTextFile(node_path.join(this._pluginPath, content_item.controller)) : undefined;

                let getPluginController: GetPluginBlockController | undefined = undefined;
                if (component_controller_string) {
                  const AsyncFunction = Object.getPrototypeOf(
                    async function () {},
                  ).constructor;
                  const func = new AsyncFunction(component_controller_string);
                  
                  getPluginController = await func();
                }
  
                const definition = new (class extends ExternalPluginBlockTypeDefinition {
                  override name = content_item.name;
                  override icon = content_item.icon;
                  
                  override resizableBlockHeight = content_item.resizableBlockHeight;

                  override get title() {
                      const title = convertTranslatedPluginTitle(
                        content_item.title,
                        this.pluginController.appManager,
                        plugin_locale,
                      );
                      return title;
                  }

                  override createController(appManager: IAppManager, getResolvedBlock: () => ResolvedAssetBlock | null): BlockEditorController {
                    if (getPluginController) {
                      return new ExternalPluginBlockEditorController(appManager, getResolvedBlock, getPluginController)
                    } else {
                      return new DefaultBlockEditorController(appManager, getResolvedBlock)
                    }
                  }
                })(component_content_string, this);
                
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
                    activate: async () => {
                      const public_plugin_api = this.getPublicPluginApi();
                      const AsyncFunction = Object.getPrototypeOf(
                        async function () {},
                      ).constructor;
                      const func = new AsyncFunction('onDeactivated', 'pluginApi', code);
                      let deactivate_cb = () => {};
                      await func(
                        (callback: () => void) => (deactivate_cb = callback),
                        public_plugin_api
                      );
                      return deactivate_cb;
                    }
                  }
                });
                break;
              };
            }
          }
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