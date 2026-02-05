<template>
  <div class="NewTab">
    <div class="NewTab-header">{{ $t('desktop.newTab.noFileIsOpen') }}</div>
    <div class="NewTab-options">
      <menu-button class="NewTab-option">
        <template #button="{ toggle }">
          <button
            :title="$t('sourcePage.elements.create')"
            class="is-button is-button-action"
            @click="toggle"
          >
            <span>
              {{ $t('desktop.newTab.createNewAsset') }}
            </span>
          </button>
        </template>
        <create-asset-box
          :root-workspace-id="rootWorkspaceId"
          :root-workspace-type="rootWorkspaceType"
        ></create-asset-box>
      </menu-button>
      <button class="is-button is-button-action NewTab-option" @click="goToAsset()">
        {{ $t('desktop.newTab.goToAsset') }}
      </button>
      <button class="is-button is-button-action NewTab-option" @click="close()">
        {{ $t('desktop.newTab.close') }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import SelectAssetDialog from '~ims-app-base/components/Asset/SelectAssetDialog.vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import CreateAssetBox from '~ims-app-base/components/Asset/CreateAssetBox.vue';
import UiManager from '~ims-app-base/logic/managers/UiManager';

export default defineComponent({
  name: 'NewTab',
  components: {
    MenuButton,
    CreateAssetBox,
  },
  computed: {
    projectInfo() {
      return this.$getAppManager().get(ProjectManager).getProjectInfo();
    },
    rootWorkspaceId() {
      const root_workspaces = this.projectInfo?.rootWorkspaces;
      return root_workspaces && root_workspaces.length > 0 ? root_workspaces[0].id : '00000000-0000-0000-0000-200000000002';
    },
    rootWorkspaceType() {
      return 'gdd';
    }
  },
  methods: {
    async openAsset(asset_id: string) {
      await this.$getAppManager()
        .getRouter()
        .push({
          name: 'project-asset-by-id',
          params: {
            assetId: asset_id,
          },
        });
    },
    async goToAsset() {
      console.log(this.projectInfo);
      const gdd_folder = this.$getAppManager()
        .get(ProjectManager)
        .getWorkspaceByName('gdd');
      const asset = await this.$getAppManager()
        .get(DialogManager)
        .show(
          SelectAssetDialog,
          {
            where: {
              workspaceids: gdd_folder?.id,
            },
          },
          this,
        );
      if (asset) {
        await this.openAsset(asset.id);
      }
    },
    close() {
      // TODO: make without desktop reference
      // const current_tab = this.tabController.currentTab;
      // if (current_tab) {
      //   this.tabController.removeTab(current_tab);
      // }
      this.$getAppManager().get(UiManager).closePage();
    },
  },
});
</script>
<style lang="scss">
.NewTab {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.NewTab-header {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 20px;
}
.NewTab-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 auto;
}
.NewTab-option {
  max-width: 225px;
  display: flex;
  justify-content: left;
}
</style>
