<template>
  <dialog-content class="AddTextCellDialog">
    <div class="Dialog-header">
      {{
        $t(
          dialog.state.isNew
            ? 'assetEditor.textGridAddCaption'
            : 'assetEditor.textGridEditCaption',
        )
      }}
    </div>
    <div class="Dialog-body AddTextCellDialog-body">
      <div class="AddTextCellDialog-row">
        <imc-editor
          v-model="content"
          class="AddTextCellDialog-text"
          :multiline="true"
        />
      </div>
    </div>
    <div class="Form-row-buttons use-buttons-action">
      <div class="Form-row-buttons-left">
        <button
          v-if="!dialog.state.isNew"
          type="button"
          class="is-button is-button-action-outlined danger"
          @click="deleteLink()"
        >
          {{ $t('common.dialogs.delete') }}
        </button>
        <button
          v-if="!dialog.state.isNew"
          type="button"
          class="is-button"
          :disabled="!canSave"
          @click="moveUp"
        >
          ↑
        </button>
        <button
          v-if="!dialog.state.isNew"
          type="button"
          class="is-button"
          :disabled="!canSave"
          @click="moveDown"
        >
          ↓
        </button>
      </div>
      <div class="Form-row-buttons-center"></div>
      <div class="Form-row-buttons-right">
        <button type="button" class="is-button" @click="dialog.close()">
          {{ $t('common.dialogs.cancelCaption') }}
        </button>
        <button
          type="button"
          class="is-button accent"
          :disabled="!canSave"
          @click="save"
        >
          {{ $t('common.dialogs.ok') }}
        </button>
      </div>
    </div>
  </dialog-content>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import ImcEditor from '~ims-app-base/components/ImcText/ImcEditor.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';
import type { AssetPropValue } from '~ims-app-base/logic/types/Props';

type DialogProps = {
  content: AssetPropValue;
  isNew: boolean;
};

type DialogResult = {
  content: AssetPropValue;
  delete?: boolean;
  moveUp?: boolean;
  moveDown?: boolean;
};

export default defineComponent({
  name: 'AddTextCellDialog',
  components: {
    DialogContent,
    ImcEditor,
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  data() {
    return {
      content: this.dialog.state.content,
    };
  },
  computed: {
    canSave() {
      return true;
    },
  },
  methods: {
    save() {
      this.dialog.close({
        content: this.content,
      });
    },
    moveUp() {
      this.dialog.close({
        content: this.content,
        moveUp: true,
      });
    },
    moveDown() {
      this.dialog.close({
        content: this.content,
        moveDown: true,
      });
    },
    deleteLink() {
      this.dialog.close({
        content: this.content,
        delete: true,
      });
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/Form';
.Form-row-buttons-right,
.Form-row-buttons-left {
  display: flex;
  gap: 5px;
}

.AddTextCellDialog {
  min-width: 600px;
}

.AddTextCellDialog-row {
  margin-bottom: 10px;
}

.AddTextCellDialog-body {
  margin-bottom: 20px;
}

.AddTextCellDialog-text {
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
