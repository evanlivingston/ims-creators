<template>
  <dialog-content
    class="InfoDialog"
    @escape-press="choose(false)"
    @enter-press="choose(true)"
  >
    <div class="InfoDialog-inner">
      <div class="Form">
        <div class="InfoDialog-header">
          {{header}}
        </div>
        <div class="InfoDialog-message">
          {{message}}
          <a :href="link" v-if="link">{{ link }}</a>
        </div>
        <div class="Form-row-message" v-if="errorMessage">
          <div class="Form-message-error">
            {{errorMessage}}
          </div>
        </div>
        <div class="Form-row-buttons">
          <div class="Form-row-buttons-center">
            <button type="button" class="is-button is-button-green"  @click="close()">
              {{ $t('common.dialogs.ok') }}
            </button>
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
.InfoDialog-message{
  margin-bottom: 20px;
  text-align: left;
}
.InfoDialog-header{
  margin-bottom: 20px;
  font-weight: bold;
  text-align: center;
}
.InfoDialog-inner{
  width: 500px;
}
</style>