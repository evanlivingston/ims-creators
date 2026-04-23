<template>
    <div class="AppSyncMenu">       
      <menu-button class="AboutGameConfigurePage-manage-languages">
        <template #button="{ toggle }">
          <button
            :class="{ loading: syncIsRunning }"
            class="is-button is-button-icon AppSyncMenu-button"
            :title="$t('desktop.fsSync.synchronization')"
            @click="toggle"
          >
              <i class="ri-loop-right-line"></i>
          </button>
          <i v-if="hasSyncError" class="AppSyncMenu-hasError ri-error-warning-line"></i>
        </template>
        <menu-list :menu-list="syncMenuList"></menu-list>
      </menu-button>
    </div>
</template>

<script lang="ts">
import DesktopSyncManager from '#logic/managers/DesktopSyncManager';
import type { SyncInfo } from '#logic/types/SyncTypes';
import { defineComponent } from 'vue';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import SyncManageDialog from './SyncManageDialog.vue';
import AuthManager from '~ims-app-base/logic/managers/AuthManager';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import BuyLicenseDialog from './BuyLicenseDialog.vue';
import type { MenuListItem } from '~ims-app-base/logic/types/MenuList';
import DesktopProjectManager from '#logic/managers/DesktopProjectManager';
import type { Workspace } from '~ims-app-base/logic/types/Workspaces';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import DesktopCreatorManager from '#logic/managers/DesktopCreatorManager';

export default defineComponent({
  name: 'AppSyncMenu',
  components: {
    MenuButton,
    MenuList,
  },
  computed: {
    syncIsRunning(){
      return this.syncInfo ? this.syncInfo.inProcess : false;
    },
    hasSyncError(){
       return this.syncInfo ? this.syncInfo.error : null;
    },
    syncInfo(): SyncInfo | undefined {
      return this.$getAppManager().get(DesktopSyncManager).getSyncStatus();
    },
    userInfo() {
      return this.$getAppManager().get(AuthManager).getUserInfo();
    },
    projectInfo() {
      return this.$getAppManager().get(ProjectManager).getProjectInfo();
    },
    syncMenuList() {
      const list: MenuListItem[] = [];
      list.push({
        title: this.$t('desktop.fsSync.menu.errors'),
        action: async () => await this.openSyncManageDialog(),
      });
      if(this.syncInfo?.inProcess) {
        list.push({
          title: this.$t('desktop.fsSync.menu.pause'),
          action: async () => {
            await this.$getAppManager().get(DesktopSyncManager).pauseSyncProject();
            this.$getAppManager().get(UiManager).showSuccess(this.$t('desktop.fsSync.menu.pauseEnd'));
          }
        });
      }
      else if(this.projectInfo?.id){
        list.push({
          title: this.$t('desktop.fsSync.menu.resume'),
          action: async () => {
            await this.$getAppManager().get(DesktopSyncManager).resumeSyncProject()
            this.$getAppManager().get(UiManager).showSuccess(this.$t('desktop.fsSync.menu.resumeEnd'));
          }
        });
      }
      return list;
    },
  },
  methods: {
    async openSyncManageDialog() {
      const project_info = this.projectInfo;
      if(project_info?.id) {
        await this.$getAppManager().get(DialogManager).show(SyncManageDialog, {});
      }
      else {
        if(!this.userInfo){
          await this.$getAppManager()
            .get(AuthManager)
            .ensureLoggedInDialog(this.$t('auth.needLoginForAction'));
        }
        else {
          if(project_info && project_info.license?.features.desktopSync){
              try {
                const new_project_info = await this.$getAppManager()
                .get(DesktopProjectManager)
                .createProject({
                  title: project_info.title,
                  template_ids: [],
                  menu_settings: {
                    'menu-about': false,
                    'menu-gamedesign': true,
                    'menu-team': true,
                  },
                })
                if(!project_info.localPath) {
                  throw Error('localPath is not set') ;
                }
                await this.$getAppManager().get(DesktopCreatorManager).connectToCloudProject(new_project_info);
                await this.$getAppManager().get(DesktopSyncManager).runSync();
              }
              catch(err: any) {
                this.$getAppManager().get(UiManager).showError(err.message);
              }
          }
          else {
            await this.$getAppManager().get(DialogManager).show(BuyLicenseDialog, {});
          }
        }
      }
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