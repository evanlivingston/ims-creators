<template>
  <dialog-content class="ManageVariableListDialog">
    <div class="Dialog-header">
      {{ $t('imsDialogEditor.var.manageVariables') }}
    </div>
    <div class="Dialog-body">
      <variable-list :variable-controller="dialogController"></variable-list>
    </div>
    <div class="Form-row-buttons">
      <div class="Form-row-buttons-center use-buttons-action">
        <button type="button" class="is-button" @click="addVariable">
          {{ $t('imsDialogEditor.var.createVariable') }}
        </button>
        <button
          type="button"
          class="is-button accent ManageVariableListDialog-button-ok"
          @click="save"
        >
          {{ $t('common.dialogs.close') }}
        </button>
      </div>
    </div>
  </dialog-content>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import DialogContent from '~ims-app-base/components/Dialog/DialogContent.vue';
import type { DialogInterface } from '~ims-app-base/logic/managers/DialogManager';
import type { DialogBlockController } from '../editor/DialogBlockController';
import VariableList from './VariableList.vue';
import { nodeVariableAdd } from '../logic/nodeVariables';
import {
  injectedProjectContext,
  type IProjectContext,
} from '~ims-app-base/logic/types/IProjectContext';

type DialogProps = {
  dialogController: DialogBlockController;
  projectContext: IProjectContext;
};

type DialogResult = void;

export default defineComponent({
  name: 'ManageVariableListDialog',
  components: {
    DialogContent,
    VariableList,
  },
  provide() {
    return {
      projectContext: this.dialog.state.projectContext,
    };
  },
  props: {
    dialog: {
      type: Object as PropType<DialogInterface<DialogProps, DialogResult>>,
      required: true,
    },
  },
  setup() {
    const projectContext = inject(injectedProjectContext);
    assert(projectContext, 'Project context not provided');
    return {
      projectContext,
    };
  },
  data() {
    return {};
  },
  computed: {
    variableList() {
      return [...this.dialogController.getVariables()];
    },
    dialogController() {
      return this.dialog.state.dialogController;
    },
  },
  methods: {
    save() {
      this.dialog.close();
    },
    async addVariable() {
      const new_variable = await nodeVariableAdd(
        this.projectContext,
        this.variableList,
        {
          alreadyExist: this.$t('imsDialogEditor.var.variableAlreadyExists'),
        },
      );
      if (!new_variable) return;
      this.dialogController.addVariable(new_variable);
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/Form';

.ManageVariableListDialog-row {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 5px;
}

.ManageVariableListDialog-list,
.ManageVariableListDialog-empty {
  margin-bottom: 20px;
}

.ManageVariableListDialog-empty {
  text-align: center;
}

.ManageVariableListDialog-row-name {
  flex: 1;
}
.ManageVariableListDialog-row-type {
  flex: 2;
}

.ManageVariableListDialog {
  width: 700px;
}
</style>
