<template>
  <dialog-content
    class="PromptDialog"
    @escape-press="cancelUpdate"
    @enter-press="closeAndInstall"
  >
    <div class="PostDownloadDialog">
      <div class="Form">
        <div class="PostDownloadDialog-header">
          {{header}}
        </div><div class="PostDownloadDialog-message">
          {{message}}
        </div>
        <div class="Form-row-buttons">
          <div class="Form-row-buttons-center">
            <input type="button" :disabled="opening" :value="$t('desktop.about.closeAndInstall')" class="is-button accent" @click="closeAndInstall()">
            <input type="button" :disabled="opening" :value="$t('common.dialogs.cancel')" class="is-button" @click="cancelUpdate()">
          </div>
        </div>
      </div>
    </div>
  </dialog-content>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import DesktopUpdateManager from '#logic/managers/DesktopUpdateManager';

type DialogProps = {
  header: string | null;
  message: string | null;
  path?: string | null;
};

type DialogResult = boolean | null;

export default defineComponent({
  name: "PostDownloadDialog",
  components: {
    DialogContent,
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  data(){
    return {
      opening: false
    }
  },
  computed:{
    message(){
      return this.dialog.state.message;
    },
    header(){
      return this.dialog.state.header;
    },
    path(){
      return this.dialog.state.path;
    }
  },
  methods:{
    async closeAndInstall(){
      await this.$getAppManager().get(UiManager).doTask(async () => {
        //const res = await this.$getAppManager().get(UiManager).doIfCanClose(() =>{
          this.opening = true;
          this.$getAppManager().get(DesktopUpdateManager).doUpdateAfterDownloading();
        //})
        //if (res)
        this.dialog.close();
      })
    },
    cancelUpdate() {
      this.dialog.close();
      this.$getAppManager().get(UiManager).showSuccess(this.$t('desktop.about.runUpdate') + this.path);
    }
  }
});
</script>

<style scoped>
.PostDownloadDialog-message{
  margin-bottom: 20px;
  text-align: center;
}
.PostDownloadDialog-header{
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
}
.PostDownloadDialog{
  min-width: 500px;
}
</style>
