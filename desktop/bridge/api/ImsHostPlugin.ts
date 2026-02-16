import { ImsHostBase } from './ImsHostBase';
import * as node_path from 'path';
import * as fs from 'fs';
import { getImsHostWindow } from '../../electron/imshost-api';
import { assert } from "~ims-app-base/logic/utils/typeUtils";
import type { PluginInstalledFrom, PluginSavedDescription } from '~ims-app-base/logic/managers/Plugin/PluginEntity';
import JSZip from 'jszip';

export default class ImsHostPlugin extends ImsHostBase {

  get imshost() {
    return getImsHostWindow(this._window);
  }

  private async _getSavedPlugins() {
    if (!this.imshost) return [];
    try {
      const plugins_raw = await this.imshost.storage.getItem('plugins-' + 0) as string;
      const plugins = JSON.parse(plugins_raw);
      return plugins['plugins'] as PluginSavedDescription[];

    } catch (err: any) {
      return [];
    }
  }

  private async _setSavedPlugins(val: PluginSavedDescription[]) {
    if (!this.imshost) return;
    try {
      await this.imshost.storage.setItem('plugins-' + 0, JSON.stringify({ plugins: val }));
    } catch (err: any) {
      throw new Error(`An error occurred to set saved plugins: ${err}`);
    }
  }

  async getPluginDir() {
    assert(this.imshost, 'Cannot access to imshost');

    const user_dir = await this.imshost.shell.getUserDataFolder();
    return node_path.join(user_dir, 'plugins');
  }

  async readPluginDir(path: string) {
    return await fs.promises.readdir(path, {
      withFileTypes: true,
    });
  }

  async installPluginFromPath(from_path: string, from: PluginInstalledFrom) {
    const imshost = this.imshost;
    assert(imshost, 'Cannot access to imshost');

    const name = node_path.basename(from_path, node_path.extname(from_path));
    const plugin_dir = await this.getPluginDir();
    await imshost.fs.mkDir(plugin_dir, true);
    const plugin_path = node_path.join(plugin_dir, name);

    const data = await imshost.fs.readFile(from_path);
    const zip = await JSZip.loadAsync(data);
    
    const test_res = [] as any[];
    await Promise.all(
      Object.values(zip.files).map(async entry => {
        const target = node_path.join(plugin_path, entry.name);
        test_res.push([target, node_path.dirname(target)]);
        if (entry.dir) {
          await imshost.fs.mkDir(target, true);
        } else {
          await imshost.fs.mkDir(node_path.dirname(target), true);
          await imshost.fs.writeFile(target, await entry.async('nodebuffer'));
        }
      })
    );

    const plugin: PluginSavedDescription = {
      name: name,
      from: from,
      activated: false,
      disabledContent: [],
    }

    const new_saved_plugins = [...await this._getSavedPlugins()];
    new_saved_plugins.push(plugin);
    await this._setSavedPlugins(new_saved_plugins);

    return plugin;
  }

  async deletePluginByName(plugin_name: string) {
    const new_saved_plugins = [...await this._getSavedPlugins()];
    const deleted_plugin_ind = new_saved_plugins.findIndex(x => x.name === plugin_name);
    if (deleted_plugin_ind >= 0) new_saved_plugins.splice(deleted_plugin_ind, 1);
    await this._setSavedPlugins(new_saved_plugins);

    try {
      const plugin_dir = await this.getPluginDir();
      assert(plugin_dir);
      const plugin_path = node_path.join(plugin_dir, plugin_name);
      await fs.promises.rmdir(plugin_path, {recursive: true});
    } catch (err: any) {
      throw new Error(`Plugin directory deletion failed`);
    }
  }
}