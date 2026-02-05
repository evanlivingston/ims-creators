<template>
  <dialog-content
    class="PromptDialog"
    @escape-press="closeDialog"
    @enter-press="getNewVersion"
  >
    <div class="NewVersionAvailableDialog">
      <div class="Form">
        <div class="NewVersionAvailableDialog-header">
          {{header}}
        </div>
        <div class="Form-row-buttons">
          <div class="Form-row-buttons-center" v-if="updateStatusIsAvailable">
            <button 
              type="button" 
              class="is-button is-button-green" 
              @click="getNewVersion()"
            >{{ updateOrDownload }}</button>
          </div>
          <div class="Form-row-buttons-center" v-if="updateStatusIsDownloading">
            <button type="button" class="is-button is-button-red" @click="cancelDownload()">{{ cancel }}</button>
            <button type="button" class="is-button is-button-blue" @click="closeDialog()">{{ close }}</button>
          </div>
        </div>
      </div>
    </div>
  </dialog-content>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import DialogManager, { type DialogInterface } from '~ims-app-base/logic/managers/DialogManager';
import DesktopUpdateManager from '#logic/managers/DesktopUpdateManager';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import { UpdateStatus } from '#logic/types/AutoUpdateTypes';

type DialogProps = {
};

type DialogResult = boolean | null;

export default defineComponent({
  name: "NewVersionAvailableDialog",
  components: {
    DialogContent,
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  computed:{
    header(){
      return this.$t('desktop.about.newVersion', {
        version: ''
      });
    },
    updateOrDownload(){
      return this.$t('desktop.about.download');
    },
    cancel(){
      return this.$t('desktop.about.cancelDownload');
    },
    close(){
      return this.$t('common.dialogs.close');
    },
    updateStatusIsAvailable(){
      return this.updateManager.getStatus() === UpdateStatus.AVAILABLE;
    },
    updateStatusIsDownloading(){
      return this.updateManager.getStatus() === UpdateStatus.DOWNLOADING;
    },
    updateManager(){
      return this.$getAppManager().get(DesktopUpdateManager);
    }
  },
  methods:{
    async cancelDownload() {
      const ask = await this.$getAppManager().get(DialogManager).showDialog(ConfirmDialog, {
          header: this.$t('desktop.about.loadingError'),
          message: this.$t('desktop.about.areYouSureCancelDownload')
      })
      if (!ask) return false;
      await this.updateManager.cancelDownload();
      this.closeDialog();
      return true;
    },
    closeDialog(){
      this.dialog.close();
    },
    async getNewVersion(){
      const started = await this.updateManager.startDownloadUpdateFile();
      if (started){
        this.dialog.close();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.NewVersionAvailableDialog-message{
  margin-bottom: 20px;
  text-align: left;
  max-height: 240px;
  overflow: auto;
}
.NewVersionAvailableDialog-header{
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
}
.NewVersionAvailableDialog{
  width: 500px;
}
.NewVersionAvailableDialog-image{
  width: calc(100% + 30px);
  display: block;
  margin: -30px -15px 15px;
}
</style>
