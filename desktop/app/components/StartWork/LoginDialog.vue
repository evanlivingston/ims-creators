<template>
  <dialog-content class="LoginDialog">
    <login-form
      v-if="showType === 'login'"
      :message="dialog.state.message"
      :open-external="true"
      @success-login="dialog.close(true)"
      @show-register="showType = 'register'"
    />
  </dialog-content>
</template>

<script lang="ts" type="text/ecmascript-6">
import { defineComponent, type PropType } from 'vue';
import LoginForm from './LoginForm.vue';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';

type DialogProps = {
  message?: string;
};

type DialogResult = boolean | undefined | null;

export default defineComponent({
  name: 'LoginDialog',
  components: {
    DialogContent,
    LoginForm,
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  data() {
    return {
      showType: 'login' as 'login' | 'register',
    };
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
.LoginDialog {
  padding: 0px !important;
}
</style>
