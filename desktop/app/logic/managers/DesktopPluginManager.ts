import PluginManager from '~ims-app-base/logic/project-sub-contexts/PluginSubContext';
import PluginControllerDev from './Plugins/PluginControllerDev';
import { PluginInstalledFrom, type PluginSavedDescription } from '~ims-app-base/logic/managers/Plugin/PluginEntity';
import * as node_path from "path";
import PluginControllerProd from './Plugins/PluginControllerProd';
import SyncStoreCore from '~ims-app-base/logic/types/SyncStoreCore';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';

export default class DesktopPluginManager extends PluginManager {
  private readonly _core: SyncStoreCore;

  constructor(appManager: IAppManager) {
    super(appManager);

    this._core = new SyncStoreCore({
      storageGetter: () => window.imshost.storage.getItem('plugins-' + 0),
      storageSetter: (val) => window.imshost.storage.setItem('plugins-' + 0, val),
    })
  }

  override async init(): Promise<void> {
    await this._core.init();
  }
  
  get _savedPlugins(): PluginSavedDescription[] {
    return this._core.getKey('plugins', []);
  }

  set _savedPlugins(val: PluginSavedDescription[]) {
    this._core.setKey('plugins', val);
  }

  private async _registerSavedDevPlugin(saved_plugin: PluginSavedDescription): Promise<boolean> {
    try {
      if (!saved_plugin.devPluginPath) {
        throw new Error(`Dev plugin path is not set for plugin: ${saved_plugin.name}`);
      }
      const plugin = new PluginControllerDev(this.appManager, saved_plugin.devPluginPath);
      await plugin.load();
      const installed_plugin = {
        name: saved_plugin.name,
        hasUpdates: null,
        controller: plugin,
        installedFrom: PluginInstalledFrom.DEV,
        // disabledContent: saved_plugin.disabledContent
      }
      this._installedPlugins.set(saved_plugin.name, installed_plugin);
      return true;
    }
    catch (err: any) {
      throw new Error(`Plugin register failed ${saved_plugin.name}: ${err.message}`);
    }
  }

  private async _registerSavedPlugin(saved_plugin: PluginSavedDescription): Promise<boolean> {
    try {
      const plugin_dir = await window.imshost.plugin.getPluginDir();
      const plugin_path = node_path.join(plugin_dir, saved_plugin.name);

      const plugin = new PluginControllerProd(this.appManager, plugin_path);
      await plugin.load();
      this._installedPlugins.set(saved_plugin.name, {
        name: saved_plugin.name,
        controller: plugin,
        installedFrom: saved_plugin.from,
      });

      return true
    }
    catch (err: any) {
      throw new Error(`Plugin register failed ${saved_plugin.name}: ${err.message}`);
    }
  }

  override async installPluginFromPath(path: string, from: PluginInstalledFrom) {
    const name = node_path.basename(path, node_path.extname(path));
    try {

      await this.deletePluginByName(name);
      
      const plugin = await window.imshost.plugin.installPluginFromPath(path, from);

      const registered = await this._registerSavedPlugin(plugin);
      if (!registered) {
        throw Error(`Plugin ${plugin.name} cannot be registered`);
      }

      await this._activatePlugin(plugin.name);
    } catch (err: any) {
      const pl_index = this._savedPlugins.findIndex(pl => pl.name === name);
      if (pl_index >= 0) this._savedPlugins[pl_index].error = err.message;
      throw new Error(`Plugin ${name} cannot be installed: ${err.message}`);
    }
  }

  override async activateSavedPlugins(): Promise<void> {
    const registered_saved = [];
    for (const saved_plugin of this._savedPlugins) {
      let registered;
      if (saved_plugin.from === PluginInstalledFrom.DEV) {
        registered = await this._registerSavedDevPlugin(saved_plugin);
      }
      else {
        registered = await this._registerSavedPlugin(saved_plugin);
      }
      if (registered) registered_saved.push(saved_plugin)
    }
    if (registered_saved.length !== this._savedPlugins.length) {
      this._savedPlugins = registered_saved;
    }

    for (const plugin_name of this._installedPlugins.keys()) {
      try {
        await this._activatePlugin(plugin_name);
      }
      catch (err: any) {
        throw new Error(`Cannot activate plugin ${plugin_name}: ${err.message}`);
      }
    }
  }

  override async deletePluginByName(plugin_name: string): Promise<boolean> {
    const uninstalled = await super.deletePluginByName(plugin_name);

    if (uninstalled) {
      try {
        await window.imshost.plugin.deletePluginByName(plugin_name);
        return true;
      } catch (err: any) {
        throw new Error(`Cannot delete plugin ${plugin_name}: ${err.message}`);
      }
    } else {
      return false
    }
  }
}