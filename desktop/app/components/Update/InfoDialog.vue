<template>
  <dialog-content
    class="PromptDialog"
    @escape-press="choose(false)"
    @enter-press="choose(true)"
  >
    <div class="InfoDialog">
      <div class="Form">
        <div class="InfoDialog-header">
          {{header}}
        </div>
        <div class="InfoDialog-message">
          {{message}}
          <a href="https://ims.cr5.space" v-if="link">https://ims.cr5.space</a>
        </div>
        <div class="Form-row-message" v-if="errorMessage">
          <div class="Form-message-error">
            {{errorMessage}}
          </div>
        </div>
        <div class="Form-row-buttons">
          <div class="Form-row-buttons-center">
            <input type="button" :value="$t('common.confirmDialog.ok')" class="is-button is-button-green"  @click="close()">
          </div>
        </div>
      </div>
    </div>
  </dialog-content>
</template>

<script lang="ts" type="text/ecmascript-6">
import { defineComponent, type PropType } from 'vue';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';

type DialogProps = {
  header: string | null;
  message: string | null;
  path?: string | null;
  link?: string;
  errorMessage?: string | null;
};

type DialogResult = boolean | null;

export default defineComponent({
  name: "InfoDialog",
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
      return this.dialog.state.header;
    },
    message(){
      return this.dialog.state.message;
    },
    link(){
      return this.dialog.state.link;
    },
    errorMessage(){
      return this.dialog.state.errorMessage;
    }
  },
  methods:{
    close(){
      this.dialog.close();
    },
    choose(val: boolean | null) {
      this.dialog.close(val);
    },
  }
})
</script>

<style lang="scss" scoped>
.FormSelectFolder-main{
  display: flex;
}

.FormSelectFolder-text{
  display: flex;
  margin-right: 5px;
}

.FormSelectFolder-autodetect{
  display: block;
  margin-right: 5px;
  padding: 5px 7px;
  &:before{
    content: "";
    display: block;
    width:20px;
    height:20px;
    background: url('../../assets/images/remixicon/file-search-line-blue.svg') no-repeat center;
    background-size: contain;
  }
  &:hover:before{
    filter: brightness(0) invert(1);
  }
}

.FormSelectFolder-error{
  background: #ffe6e6;
  border-radius: 4px;
  padding: 10px 20px;
  color:#d20009;
  margin-top:10px;
}

.InfoDialog-message{
  margin-bottom: 20px;
  text-align: left;
}
.InfoDialog-header{
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
}
.InfoDialog{
  width: 500px;
}

.FormSelectFolder{
  margin-top: 15px;
}
</style>