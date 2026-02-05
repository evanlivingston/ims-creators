<template>
  <dialog-content class="TextGridBlockSettingsDialog">
    <div class="Dialog-header">
      {{ $t('assetEditor.textGridBlockCreateDialogHeader') }}
    </div>
    <div class="Dialog-body">
      <div class="TextGridBlockSettingsDialog-row">
        {{ $t('assetEditor.textGridBlockColumnsCountPlaceHolder') }}:
      </div>
      <div
        class="TextGridBlockSettingsDialog-row TextGridBlockSettingsDialog-link-row"
      >
        <form-input
          class="TextGridBlockSettingsDialog-linkInput"
          :autofocus="true"
          :value="columnsCount?.toString()"
          @input="setColumnsCount($event)"
        />
      </div>
    </div>
    <div class="Form-row-buttons">
      <div class="Form-row-buttons-center use-buttons-action">
        <button type="button" class="is-button" @click="dialog.close()">
          {{ $t('common.dialogs.cancelCaption') }}
        </button>
        <button
          type="button"
          class="is-button accent TextGridBlockSettingsDialog-button-ok"
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
import FormInput from '~ims-app-base/components/Form/FormInput.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';

type DialogProps = {
  columnsCount: number;
};

type DialogResult = { columnsCount: number };

export default defineComponent({
  name: 'TextGridBlockSettingsDialog',
  components: {
    DialogContent,
    FormInput,
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  data() {
    return {
      columnsCount: (this.dialog.state.columnsCount
        ? this.dialog.state.columnsCount
        : 4) as number | null,
    };
  },
  computed: {
    canSave() {
      return !!this.columnsCount && this.columnsCount >= 2;
    },
  },
  methods: {
    save() {
      this.dialog.close(
        this.columnsCount
          ? {
              columnsCount: this.columnsCount,
            }
          : undefined,
      );
    },
    setColumnsCount(columns_count: string) {
      const cnt = parseInt(columns_count);
      this.columnsCount = Number.isNaN(cnt) ? null : cnt;
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/Form';
.TextGridBlockSettingsDialog {
  width: 600px;
}
.TextGridBlockSettingsDialog-row {
  margin-bottom: 10px;
}

.TextGridBlockSettingsDialog-kind {
  background-color: var(--input-bg-color);
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-color: var(--input-border-color);
  border-width: 1px 0px 1px 1px;
  border-style: solid;
  background-size: 16px 16px;
  background-position: center center;
  background-repeat: no-repeat;
  width: 32px;
  box-sizing: border-box;

  .TextGridBlockSettingsDialog-kind-icon {
    width: 18px;
    height: 18px;
    line-height: normal;
    display: flex;
  }
}

.TextGridBlockSettingsDialog-link-row {
  display: flex;
}

.TextGridBlockSettingsDialog-linkInput {
  flex: 1;
  --input-border-radius: 0px 4px 4px 0px;
}

.TextGridBlockSettingsDialog-asLinkWarning {
  border: 1px solid;
  border-radius: 4px;
  color: var(--color-warn);
  padding: 15px 20px;
  margin-bottom: 10px;
}
</style>
