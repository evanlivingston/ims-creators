<template>
  <div class="DesktopSettingsDialog_plugins_plugin">
    <div class="DesktopSettingsDialog_plugins_plugin-main">
      <div class="DesktopSettingsDialog_plugins_plugin-main-icon" v-if="plugin.entity.icon">
        <img :src="plugin.entity.icon" alt="icon">
      </div>
      <div class="DesktopSettingsDialog_plugins_plugin-main-content">
        <div class="DesktopSettingsDialog_plugins_plugin-main-content-title">
          <span>{{ plugin.entity.title }}</span> ({{ $t('desktop.settings.plugins.version') }}: {{ plugin.entity.version }})
        </div>
        <div class="DesktopSettingsDialog_plugins_plugin-main-content-description">
          {{ plugin.entity.description }}
        </div>
        <div v-if="plugin.error" class="DesktopSettingsDialog_plugins_plugin-main-content-error">
          {{ plugin.error }}
        </div>
      </div>
      <div class="DesktopSettingsDialog_plugins_plugin-main-options">
        <button class="is-button is-button-icon" @click="removePlugin">
          <i class="ri-delete-bin-line"></i>
        </button>
        <ims-toggle v-if="!plugin.error" :model-value="plugin.activated" @update:model-value="togglePlugin($event)"></ims-toggle>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { PluginListItemEntity } from '~ims-app-base/logic/managers/Plugin/PluginEntity';
import PluginManager from '~ims-app-base/logic/project-sub-contexts/PluginSubContext';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import ImsToggle from '~ims-app-base/components/Common/ImsToggle.vue';

export default defineComponent({
  name: 'DesktopSettingsDialog_plugins_plugin',
  components: {
    ImsToggle
  },
  props: {
    plugin: {
      type: Object as PropType<PluginListItemEntity>,
      required: true
    }
  },
  emits: ['update-plugins'],
  computed: {
    pluginController() {
      return this.$getAppManager().get(PluginManager).getPluginController(this.plugin.name)
    }
  },
  methods: {
    async togglePlugin(enable: boolean) {
      if (!enable) {
        await this.pluginController.deactivate()
      } else {
        await this.pluginController.activate()
      }

      this.$emit('update-plugins');
    },
    async removePlugin() {
      this.$getAppManager().get(UiManager).doTask(async () => {
        const answer = await this.$getAppManager()
        .get(DialogManager)
        .show(ConfirmDialog, {
          header: this.$t('desktop.settings.plugins.delete.uninstallHeader'),
          message: this.$t('desktop.settings.plugins.delete.confirm', { title: this.plugin.entity.title }),
          yesCaption: this.$t('desktop.settings.plugins.uninstallButton'),
          danger: true,
        });
        if (!answer) return;
        await this.$getAppManager().get(PluginManager).deletePluginByName(this.plugin.name);
        this.$emit('update-plugins');
      })
    }
  }

})
</script>
<style lang="scss" scoped>
.DesktopSettingsDialog_plugins_plugin {
  border: 1px solid var(--local-border-color);
  border-radius: 4px;
  padding: 10px;
}
.DesktopSettingsDialog_plugins_plugin-main {
  display: flex;
  align-items: center;
  gap: 5px;
}
.DesktopSettingsDialog_plugins_plugin-main-icon {
  width: 50px;
  height: 50px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 999px;
  }
}

.DesktopSettingsDialog_plugins_plugin-main-content {
  flex: 1;

  .DesktopSettingsDialog_plugins_plugin-main-content-title {
    span {
      font-weight: bold;
    }
  }

  .DesktopSettingsDialog_plugins_plugin-main-content-description {
    color: var(--local-sub-text-color);
  }
  .DesktopSettingsDialog_plugins_plugin-main-content-error {
    color: var(--color-danger);
  }
}

.DesktopSettingsDialog_plugins_plugin-main-options {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>