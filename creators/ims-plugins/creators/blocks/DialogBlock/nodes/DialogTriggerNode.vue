<template>
  <ContextMenuZone
    class="DialogTriggerNode DialogEditorNode"
    :menu-list="contextMenu"
  >
    <div
      class="DialogTriggerNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <i :class="nodeDescriptor.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
    </div>
    <div class="DialogTriggerNode-body DialogEditorNode-body">
      <div class="DialogTriggerNode-body-main">
        <ExecHandle id="in" type="target" :position="Position.Left" />
        <div class="DialogTriggerNode-content">
          <DataFieldInput
            v-model="triggerVal"
            :data-type="{
              Type: AssetPropType.STRING,
            }"
            :readonly="readonly"
          ></DataFieldInput>
        </div>
        <ExecHandle id="out" type="source" :position="Position.Right" />
      </div>
      <div
        v-if="inputParameters.length > 0 || outputParameters.length > 0"
        class="DialogTriggerNode-parameters"
      >
        <ContextMenuZone
          v-for="param_gr of parametersGrid"
          :key="(param_gr.isOutput ? 'out-' : 'in-') + param_gr.variable.name"
          class="DialogTriggerNode-parameters-one"
          :class="param_gr.isOutput ? 'type-output' : 'type-input'"
          :menu-list="
            getParameterContextMenu(param_gr.variable, param_gr.isOutput)
          "
        >
          <DataField
            :in-id="
              !param_gr.isOutput
                ? generateDataPinId(false, param_gr.variable.name)
                : ''
            "
            :out-id="
              param_gr.isOutput
                ? generateDataPinId(true, param_gr.variable.name)
                : ''
            "
            :model-value="
              !param_gr.isOutput
                ? nodeDataController.values[param_gr.variable.name]
                : null
            "
            :play-value="
              !param_gr.isOutput
                ? playingNodeData?.values
                  ? playingNodeData?.values[param_gr.variable.name]
                  : null
                : dialogPlayer.playGetCurrentNodeParam(param_gr.variable.name)
            "
            :caption="param_gr.variable.title"
            :node-data-controller="nodeDataController"
            :title="param_gr.variable.description ?? ''"
            :readonly="readonly"
            :play-value-set="param_gr.isOutput && playWaitUser"
            @update:play-value="
              dialogPlayer.playSetCurrentNodeParam(
                param_gr.variable.name,
                $event,
              )
            "
            @update:model-value="
              setParamValue(param_gr.variable, param_gr.isOutput, $event)
            "
          ></DataField>
        </ContextMenuZone>
      </div>
      <div v-if="playWaitUser" class="DialogTriggerNode-play">
        <button class="is-button" @click="dialogPlayer.playChoose(null)">
          {{ $t('imsDialogEditor.play.continue') }}
        </button>
      </div>
    </div>
  </ContextMenuZone>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';
import type { NodeDataController } from '../editor/NodeDataController';
import { AssetPropType } from '~ims-app-base/logic/types/Props';
import ContextMenuZone from '~ims-app-base/components/Common/ContextMenuZone.vue';
import type { DialogVariable } from '../editor/DialogBlockController';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import DataField from '../parts/DataField.vue';
import {
  nodeVariableAdd,
  nodeVariableChange,
  nodeVariableDuplicate,
} from '../logic/nodeVariables';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import { generateDataPinId } from '../editor/DialogEditor';
import DataFieldInput from '../parts/DataFieldInput.vue';
import type { ScriptBlockPlainPropValue } from '../logic/nodeStoring';
import type { ScriptPlayNode } from '../play/ScriptPlayNode';
import type { DialogPlayer } from '../play/DialogPlayer';
import { injectedProjectContext } from '~ims-app-base/logic/types/IProjectContext';

export default defineComponent({
  name: 'DialogTriggerNode',
  components: {
    ExecHandle,
    ContextMenuZone,
    DataField,
    DataFieldInput,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    nodeDataController: {
      type: Object as PropType<NodeDataController>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    playingNodeData: {
      type: [Object, null] as PropType<ScriptPlayNode> | null,
      default: null,
    },
    dialogPlayer: {
      type: Object as PropType<DialogPlayer>,
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
  computed: {
    Position() {
      return Position;
    },
    AssetPropType() {
      return AssetPropType;
    },
    playWaitUser() {
      return (
        this.dialogPlayer.currentPlayingNode?.id === this.id &&
        this.outputParameters.length > 0
      );
    },
    triggerVal: {
      get() {
        return this.nodeDataController.subject ?? null;
      },
      set(val: string) {
        this.nodeDataController.setSubject(val);
      },
    },
    parametersGrid(): {
      variable: DialogVariable;
      isOutput: boolean;
      index: number;
    }[] {
      const res: {
        variable: DialogVariable;
        isOutput: boolean;
        index: number;
      }[] = [];
      for (
        let i = 0;
        i < Math.max(this.inputParameters.length, this.outputParameters.length);
        i++
      ) {
        if (i < this.inputParameters.length) {
          res.push({
            variable: this.inputParameters[i],
            isOutput: false,
            index: i,
          });
        }
        if (i < this.outputParameters.length) {
          res.push({
            variable: this.outputParameters[i],
            isOutput: true,
            index: i,
          });
        }
      }
      return res;
    },
    contextMenu() {
      if (this.readonly) return [];
      return [
        {
          title: this.$t('imsDialogEditor.trigger.addInputParameter'),
          action: () => this.addParameter(false),
          icon: 'ri-arrow-right-circle-fill',
        },
        {
          title: this.$t('imsDialogEditor.trigger.addOutputParameter'),
          action: () => this.addParameter(true),
          icon: 'ri-arrow-left-circle-line',
        },
      ];
    },
    inputParameters(): DialogVariable[] {
      return this.nodeDataController.params['in'] ?? [];
    },
    outputParameters(): DialogVariable[] {
      return this.nodeDataController.params['out'] ?? [];
    },
  },
  mounted() {
    this.updatePins();
  },
  methods: {
    generateDataPinId,
    activate() {
      if (!this.$refs['content']) return;
      (this.$refs['content'] as any).focus();
    },
    async addParameter(is_out: boolean) {
      const new_variable = await nodeVariableAdd(
        this.projectContext,
        this[is_out ? 'outputParameters' : 'inputParameters'],
        {
          alreadyExist: this.$t(
            'imsDialogEditor.trigger.parameterAlreadyExists',
          ),
        },
      );
      if (!new_variable) return;
      this.nodeDataController.addParam(is_out ? 'out' : 'in', new_variable);
      this.updatePins();
    },
    async deleteParameter(param: DialogVariable, is_out: boolean) {
      const confirm = await this.$getAppManager()
        .get(DialogManager)
        .show(ConfirmDialog, {
          header: this.$t('imsDialogEditor.trigger.deleteParameter'),
          message: this.$t('imsDialogEditor.trigger.deleteParameterConfirm'),
          danger: true,
        });
      if (!confirm) return;

      this.nodeDataController.deleteParam(is_out ? 'out' : 'in', param.name);
      this.updatePins();
    },
    async changeParameter(param: DialogVariable, is_out: boolean) {
      const new_variable = await nodeVariableChange(
        this.projectContext,
        this[is_out ? 'outputParameters' : 'inputParameters'],
        param,
        {
          alreadyExist: this.$t(
            'imsDialogEditor.trigger.parameterAlreadyExists',
          ),
        },
      );
      if (!new_variable) return;
      this.nodeDataController.changeParam(
        is_out ? 'out' : 'in',
        param.name,
        new_variable,
      );
      this.updatePins();
    },
    async duplicateParameter(param: DialogVariable, is_out: boolean) {
      const new_variable = await nodeVariableDuplicate(
        this.projectContext,
        this[is_out ? 'outputParameters' : 'inputParameters'],
        param,
        {
          alreadyExist: this.$t(
            'imsDialogEditor.trigger.parameterAlreadyExists',
          ),
        },
      );
      if (!new_variable) return;
      this.nodeDataController.addParam(is_out ? 'out' : 'in', new_variable);
      this.updatePins();
    },
    getParameterContextMenu(param: DialogVariable, is_out: boolean) {
      if (this.readonly) return [];
      return [
        {
          icon: 'edit',
          title: this.$t('imsDialogEditor.trigger.changeParameter'),
          action: () => this.changeParameter(param, is_out),
        },
        {
          icon: 'copy',
          title: this.$t('imsDialogEditor.trigger.duplicateParameter'),
          action: () => this.duplicateParameter(param, is_out),
        },
        {
          icon: 'delete',
          title: this.$t('imsDialogEditor.trigger.deleteParameter'),
          action: () => this.deleteParameter(param, is_out),
          danger: true,
        },
      ];
    },
    setParamValue(
      param: DialogVariable,
      is_out: boolean,
      val: ScriptBlockPlainPropValue,
    ) {
      if (is_out) return;
      this.nodeDataController.setValue(param.name, val);
    },
    updatePins() {
      for (let i = 0; i < this.inputParameters.length; i++) {
        this.nodeDataController.setPinDataType(
          generateDataPinId(false, this.inputParameters[i].name),
          this.inputParameters[i].type,
        );
      }
      for (let i = 0; i < this.outputParameters.length; i++) {
        this.nodeDataController.setPinDataType(
          generateDataPinId(true, this.outputParameters[i].name),
          this.outputParameters[i].type,
        );
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogTriggerNode-content {
  &:not(:hover):deep(
      .DataField-in:not(.state-connected),
      .DataField-out:not(.state-connected)
    ) {
    opacity: 0;
  }
}

.DialogTriggerNode-header {
  padding: 7px 10px;
  font-size: 14px;
}
.DialogTriggerNode-body-main {
  --local-text-color: var(--imsde-node-content-text-color);
  --input-bg-color: transparent;
  --input-border-color: transparent;
  --input-text-color: var(--imsde-node-content-text-color);
  padding: 7px 10px;
  position: relative;
}
.DialogTriggerNode-addOption {
  font-weight: bold;
  font-size: 12px;
}

.DialogTriggerNode-text {
  background: transparent;
  border: none;
  color: var(--local-text-color);
  max-width: 600px;
  min-width: 150px;
}

.DialogTriggerNode-parameters {
  padding-bottom: 5px;
  display: grid;
  gap: 10px;
  align-items: center;
  border-top: 1px solid var(--imsde-node-content-inner-border-color);
  padding-top: 10px;
}

.DialogTriggerNode-parameters-one {
  margin-bottom: 5px;
  &.type-input {
    grid-column: 1;
  }
  &.type-output {
    grid-column: 2;
    justify-self: flex-end;
  }
}

.DialogTriggerNode:deep(.DataFieldInput-string) {
  min-width: 100px;
}

.DialogTriggerNode-play {
  text-align: center;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid var(--imsde-node-playing-color);
  & > .is-button {
    --button-border-color: var(--imsde-node-playing-color);
    &:not(:hover) {
      --button-text-color: var(--imsde-node-playing-color);
    }
    &:hover {
      --button-bg-color: var(--imsde-node-playing-color);
    }
  }
}
</style>
