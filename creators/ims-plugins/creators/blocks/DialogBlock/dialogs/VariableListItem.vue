<template>
  <div class="VariableListItem-row">
    <i class="VariableListItem-row-drag ri-draggable"></i>
    <FormCheckBox
      v-if="showAutoFill"
      :value="variable.autoFill"
      :icon="'ri-arrow-right-box-line'"
      :help-text="$t('imsDialogEditor.speech.autoSubstitutionHelpText')"
      @input="changeVariable(variable, { autoFill: $event })"
    />
    <div class="VariableListItem-row-name">
      <div
        class="VariableListItem-row-name-value"
        @click="editMode = true"
        @focusout="editMode = false"
      >
        <ims-input
          v-if="editMode"
          :model-value="variable.title"
          @change="renameVariable(variable, $event)"
        ></ims-input>
        <imc-presenter v-else :value="variable.title"></imc-presenter>
      </div>
      <form-builder-field-tooltip
        v-if="variable.description"
        :message="variable.description"
      />
    </div>
    <div class="VariableListItem-row-type">
      <variable-type-selector
        :model-value="variable.type"
        @update:model-value="changeVariable(variable, { type: $event })"
      ></variable-type-selector>
    </div>
    <div class="VariableListItem-row-menu">
      <menu-button>
        <menu-list :menu-list="getVariableMenu(variable)" />
      </menu-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { DialogVariable } from '../editor/DialogBlockController';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import { normalizeAssetPropPart } from '~ims-app-base/logic/types/Props';
import {
  nodeVariableAdd,
  nodeVariableChange,
  nodeVariableDuplicate,
} from '../logic/nodeVariables';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';
import VariableTypeSelector from '../parts/VariableTypeSelector.vue';
import FormBuilderFieldTooltip from '~ims-app-base/components/Form/FormBuilderFieldTooltip.vue';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import type { IDialogVariableController } from '../editor/DialogVariableController';
import ImcPresenter from '~ims-app-base/components/ImcText/ImcPresenter.vue';
import type { ScriptBlockPlainVariable } from '../logic/nodeStoring';
import FormCheckBox from '~ims-app-base/components/Form/FormCheckBox.vue';

export default defineComponent({
  name: 'VariableListItem',
  components: {
    MenuButton,
    MenuList,
    ImsInput,
    VariableTypeSelector,
    FormBuilderFieldTooltip,
    ImcPresenter,
    FormCheckBox,
  },
  props: {
    variableController: {
      type: Object as PropType<IDialogVariableController>,
      required: true,
    },
    variable: {
      type: Object as PropType<ScriptBlockPlainVariable>,
      required: true,
    },
    showAutoFill: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      editMode: false,
    };
  },
  computed: {
    variableList() {
      return [...this.variableController.getVariables()];
    },
  },
  methods: {
    async addVariable() {
      const new_variable = await nodeVariableAdd(
        this.$getAppManager(),
        this.variableList,
        {
          alreadyExist: this.$t('imsDialogEditor.var.variableAlreadyExists'),
        },
        this.showAutoFill,
      );
      if (!new_variable) return;
      this.variableController.addVariable(new_variable);
    },
    async editVariable(variable: DialogVariable) {
      const new_variable = await nodeVariableChange(
        this.$getAppManager(),
        this.variableList,
        variable,
        {
          alreadyExist: this.$t('imsDialogEditor.var.variableAlreadyExists'),
        },
        this.showAutoFill,
      );
      if (!new_variable) return;
      this.variableController.changeVariable(variable.name, new_variable);
    },
    async duplicateVariable(variable: DialogVariable) {
      const new_variable = await nodeVariableDuplicate(
        this.$getAppManager(),
        this.variableList,
        variable,
        {
          alreadyExist: this.$t('imsDialogEditor.var.variableAlreadyExists'),
        },
        this.showAutoFill,
      );
      if (!new_variable) return;
      this.variableController.addVariable(new_variable);
    },
    getVariableMenu(variable: DialogVariable) {
      return [
        {
          title: this.$t('imsDialogEditor.var.editVariable'),
          icon: 'edit',
          action: async () => {
            this.editVariable(variable);
          },
        },
        {
          title: this.$t('imsDialogEditor.var.duplicateVariable'),
          icon: 'copy',
          action: async () => {
            this.duplicateVariable(variable);
          },
        },
        ...(this.variableController.canDeleteVariable(variable.name)
          ? [
              {
                title: this.$t('imsDialogEditor.var.deleteVariable'),
                danger: true,
                icon: 'delete',
                action: async () => {
                  const confirm = await this.$getAppManager()
                    .get(DialogManager)
                    .show(ConfirmDialog, {
                      header: this.$t('imsDialogEditor.var.deleteVariable'),
                      message: this.$t(
                        'imsDialogEditor.var.deleteVariableConfirm',
                      ),
                      danger: true,
                    });
                  if (!confirm) return;
                  this.variableController.deleteVariable(variable.name);
                },
              },
            ]
          : []),
      ];
    },
    changeVariable(variable: DialogVariable, change: Partial<DialogVariable>) {
      this.variableController.changeVariable(variable.name, {
        ...variable,
        ...change,
      });
    },
    renameVariable(variable: DialogVariable, new_title: string) {
      const new_name = new_title ? normalizeAssetPropPart(new_title) : '';
      if (variable.name === new_name) {
        return;
      }
      if (!new_name) {
        this.$getAppManager()
          .get(UiManager)
          .showError(this.$t('imsDialogEditor.var.nameIsEmpty'));
        return;
      }
      const exists = this.variableList.some((v) => v.name === new_name);
      if (exists) {
        this.$getAppManager()
          .get(UiManager)
          .showError(this.$t('imsDialogEditor.var.variableAlreadyExists'));
        return;
      }
      this.variableController.changeVariable(variable.name, {
        ...variable,
        title: new_title,
        name: new_name,
      });
    },
  },
});
</script>
<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/Form';
@use '~ims-app-base/style/devices-mixins';

.VariableListItem-row {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 5px;
  @include devices-mixins.device-type(not-pc) {
    flex-wrap: wrap;
  }
}
.VariableListItem-row-drag {
  color: var(--local-sub-text-color);
  cursor: grab;
}

.VariableListItem-list,
.VariableListItem-empty {
  margin-bottom: 20px;
}

.VariableListItem-empty {
  text-align: center;
}

.VariableListItem-row-name {
  flex: 1;
  display: flex;
  min-width: 122px;
  overflow: hidden;
  padding: 4px 4px 4px 0;
}
.VariableListItem-row-name-value {
  flex: 1;
  min-width: 50px;
}
.VariableListItem-row-type {
  flex: 2;
  flex-wrap: wrap;
}
</style>
