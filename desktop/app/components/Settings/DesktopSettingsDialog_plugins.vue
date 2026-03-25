<template>
  <div class="Form DesktopSettingsDialog_plugins">
    <div class="DesktopSettingsDialog_plugins-header">
      <form-search :placeholder="$t('desktop.settings.plugins.searchPlugin') + '...'" :value="searchQuery" @change="searchQuery = $event"></form-search>
      <button class="is-button is-button-action DesktopSettingsDialog_plugins-header-button" @click="installFromDisk">{{ $t('desktop.settings.plugins.installFromDisk') }}</button>
    </div>
    <div v-if="!isLoaded" class="DesktopSettingsDialog_plugins-loading">
      <div class="loaderSpinner"></div>
    </div>
    <div v-else-if="errorMessage" class="DesktopSettingsDialog_plugins-error error-message-block">
      {{ errorMessage }}
    </div>
    <div v-else class="DesktopSettingsDialog_plugins-pluginsContent">
      <div class="DesktopSettingsDialog_plugins-pluginsContent-plugins">
        <desktop-settings-dialog_plugins_plugin
          v-for="plugin of filteredPlugins"
          :plugin="plugin"
          @update-plugins="loadPluginsList(true)"
        ></desktop-settings-dialog_plugins_plugin>
      </div>
      <div class="DesktopSettingsDialog_plugins-pluginsContent-commonSettings"></div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import FormSearch from '~ims-app-base/components/Form/FormSearch.vue';
import PluginManager from '~ims-app-base/logic/project-sub-contexts/PluginSubContext';
import { PluginInstalledFrom, type PluginListItemEntity } from '~ims-app-base/logic/managers/Plugin/PluginEntity';
import DesktopSettingsDialog_plugins_plugin from './DesktopSettingsDialog_plugins_plugin.vue';
import UiManager from '~ims-app-base/logic/managers/UiManager';

export default defineComponent({
  name: 'DesktopSettingsDialog_plugins',
  components: {
    FormSearch,
    DesktopSettingsDialog_plugins_plugin
  },
  data() {
    return {
      searchQuery: '',
      allPlugins: [] as PluginListItemEntity[],
      isLoaded: false,
      errorMessage: null
    }
  },
  async mounted() {
    await this.loadPluginsList();
  },
  computed: {
    filteredPlugins() {
      const external_plugins = this.allPlugins.filter(el => el.from !== 'internal');
      return external_plugins.filter(el => el.entity.title.includes(this.searchQuery))
    }
  },
  methods: {
    async loadPluginsList(expectChange?: boolean) {
      try{
        if (!expectChange) {
          this.isLoaded = false;
        }
        this.allPlugins = await this.$getAppManager().get(PluginManager).getPluginsList();
      } catch(err: any){
        this.errorMessage = err.message;
      } finally {
        this.isLoaded = true;
      }
    },
    async installFromDisk() {
      this.$getAppManager().get(UiManager).doTask(async () => {
        const select_res = await window.imshost.fs.showSelectFileDialog({
          filters: [{ name: "IMS-PLUGIN", extensions: ["IMS-PLUGIN"] }]
        });
        if (!select_res.canceled) {
          await this.$getAppManager().get(PluginManager).installPluginFromPath(select_res.filePaths[0], PluginInstalledFrom.LOCAL);
          await this.loadPluginsList();
        }
      });
    }
  },
})
</script>
<style lang="scss" scoped>
.DesktopSettingsDialog_plugins {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.DesktopSettingsDialog_plugins-header {
  display: flex;
  align-items: center;
  gap: 5px;
}
.DesktopSettingsDialog_plugins-header-button {
  flex-shrink: 0;
}
.DesktopSettingsDialog_plugins-pluginsContent-plugins {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>