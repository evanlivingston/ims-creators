<template>
    <div class="AppSyncMenu">
      <!-- v-if="syncIsRunning || hasSyncError" -->
        <button
            :class="{ loading: syncIsRunning }"
            class="is-button is-button-icon AppSyncMenu-button"
            :title="$t('desktop.fsSync.synchronization')"
            @click="openSyncManageDialog()"
        >
            <i class="ri-loop-right-line"></i>
        </button>
        <!--v-if="hasSyncError" -->
        <i class="AppSyncMenu-hasError ri-error-warning-line"></i>
    </div>
</template>

<script lang="ts">
import DesktopSyncManager from '#logic/managers/DesktopSyncManager';
import type { SyncInfo } from '#logic/types/SyncTypes';
import { defineComponent } from 'vue';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import SyncManageDialog from './SyncManageDialog.vue';

export default defineComponent({
  name: 'AppSyncMenu',
  components: {},
  computed: {
    syncIsRunning(){
      return this.syncInfo ? this.syncInfo.inProcess : false;
    },
    hasSyncError(){
       return this.syncInfo ? this.syncInfo.error : null;
    },
    syncInfo(): SyncInfo | undefined {
      return this.$getAppManager().get(DesktopSyncManager).getSyncStatus();
    }
  },
  methods: {
    async openSyncManageDialog() {
      await this.$getAppManager().get(DialogManager).show(SyncManageDialog, {});
    }
  }
})

</script>

<style lang="scss" scoped>
.AppSyncMenu {
  margin: auto 5px;
  position: relative;
}
.AppSyncMenu-button {
  --button-font-size: 24px;
}
.AppSyncMenu-hasError{
  position: absolute;
  bottom: -4px;
  right: -3px;
  color: var(--color-main-error);
}
</style>