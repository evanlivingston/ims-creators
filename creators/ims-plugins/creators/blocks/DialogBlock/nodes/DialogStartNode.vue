<template>
  <div class="DialogStartNode DialogEditorNode">
    <div
      class="DialogStartNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <div class="DialogStartNode-header-title">
        <i :class="nodeDescriptor.icon"></i>
        {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
      </div>
      <ExecHandle
        v-if="options.length === 0"
        id="out"
        type="source"
        :position="Position.Right"
      />
    </div>
    <div v-if="nodeDataController" class="DialogStartNode-body">
      <div v-if="options.length > 0" class="DialogStartNode-options">
        <ContextMenuZone
          v-for="(option, option_index) of options"
          :key="option_index"
          class="DialogStartNode-options-one"
          :menu-list="getOptionContextMenu(option_index)"
          ignoring-css-selector=".DataField-input"
        >
          <div class="DialogStartNode-options-one-common">
            <div class="DialogStartNode-options-one-param type-first">
              <DataField
                class="DialogStartNode-options-one-param-input"
                :in-id="generateDataPinId(false, 'condition', option_index)"
                :placeholder="$t('imsDialogEditor.speech.enterText')"
                :node-data-controller="nodeDataController"
                caption="[[t:Condition]]"
                :readonly="readonly"
                :model-value="option.values['condition'] ?? null"
                @update:model-value="
                  nodeDataController.setOptionValue(
                    option_index,
                    'condition',
                    $event,
                  )
                "
              ></DataField>
            </div>
            <div
              v-if="option.values['priority'] !== undefined"
              class="DialogStartNode-options-one-param"
            >
              <DataField
                class="DialogStartNode-options-one-param-input"
                :in-id="generateDataPinId(false, 'priority', option_index)"
                :placeholder="$t('imsDialogEditor.speech.enterText')"
                :node-data-controller="nodeDataController"
                caption="[[t:Priority]]"
                :readonly="readonly"
                :model-value="option.values['priority'] ?? null"
                @update:model-value="
                  nodeDataController.setOptionValue(
                    option_index,
                    'priority',
                    $event,
                  )
                "
              ></DataField>
            </div>
          </div>
          <div class="DialogStartNode-options-one-handle">
            <ExecHandle
              :id="`out-${option_index + 1}`"
              type="source"
              :position="Position.Right"
            ></ExecHandle>
          </div>
          <menu-button class="DialogStartNode-options-one-menu">
            <menu-list :menu-list="getOptionContextMenu(option_index)" />
          </menu-button>
        </ContextMenuZone>
        <div class="DialogStartNode-fallback">
          <span>{{ $t('imsDialogEditor.start.fallback') }}</span>
          <ExecHandle id="out" type="source" :position="Position.Right" />
        </div>
      </div>
      <div
        v-if="!readonly"
        class="DialogStartNode-addOption"
        @click="addOption"
      >
        + {{ $t('imsDialogEditor.start.addEntryPoint') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';
import DataField from '../parts/DataField.vue';
import ContextMenuZone from '~ims-app-base/components/Common/ContextMenuZone.vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import ConfirmDialog from '~ims-app-base/components/Common/ConfirmDialog.vue';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import {
  AssetPropType,
} from '~ims-app-base/logic/types/Props';
import { generateDataPinId } from '../editor/DialogEditor';
import type { NodeDataController } from '../editor/NodeDataController';
import type { DialogBlockController } from '../editor/DialogBlockController';

export default defineComponent({
  name: 'DialogStartNode',
  components: {
    ExecHandle,
    DataField,
    ContextMenuZone,
    MenuButton,
    MenuList,
  },
  props: {
    id: {
      type: String,
      default: '',
    },
    dialogController: {
      type: Object as PropType<DialogBlockController>,
      default: null,
    },
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    nodeDataController: {
      type: Object as PropType<NodeDataController>,
      default: null,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    Position() {
      return Position;
    },
    options() {
      return this.nodeDataController?.options ?? [];
    },
  },
  watch: {
    options() {
      this.updatePins();
    },
  },
  mounted() {
    this.updatePins();
  },
  methods: {
    generateDataPinId,
    updatePins() {
      if (!this.nodeDataController) return;
      for (let i = 0; i < this.options.length; i++) {
        this.nodeDataController.setPinDataType(
          generateDataPinId(false, 'condition', i),
          { Type: AssetPropType.STRING },
        );
        this.nodeDataController.setPinDataType(
          generateDataPinId(false, 'priority', i),
          { Type: AssetPropType.INTEGER },
        );
      }
    },
    addOption() {
      if (!this.nodeDataController) return;
      const new_index = this.nodeDataController.addOption();
      // Default condition is empty so the writer immediately knows where to type
      this.nodeDataController.setOptionValue(new_index, 'condition', '');
      this.updatePins();
    },
    getOptionContextMenu(option_index: number) {
      if (this.readonly) return [];
      const option = this.options[option_index];
      const items: any[] = [];
      const hasPriority = option.values['priority'] !== undefined;
      if (hasPriority) {
        items.push({
          title: this.$t('imsDialogEditor.speech.deleteOptionPriority'),
          icon: 'ri-sort-asc',
          action: async () => {
            this.nodeDataController.deleteOptionValue(option_index, 'priority');
          },
        });
      } else {
        items.push({
          title: this.$t('imsDialogEditor.speech.addOptionPriority'),
          icon: 'ri-sort-desc',
          action: async () => {
            this.nodeDataController.setOptionValue(option_index, 'priority', 0);
          },
        });
      }
      items.push({
        title: this.$t('imsDialogEditor.start.deleteEntryPoint'),
        icon: 'delete',
        danger: true,
        action: async () => {
          const confirm = await this.$getAppManager()
            .get(DialogManager)
            .show(ConfirmDialog, {
              header: this.$t('imsDialogEditor.start.deleteEntryPoint'),
              message: this.$t('imsDialogEditor.start.deleteEntryPointConfirm'),
              danger: true,
            });
          if (!confirm) return;
          this.nodeDataController.deleteOption(option_index);
        },
      });
      return items;
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogStartNode {
  min-width: 220px;
}
.DialogStartNode-header {
  padding: 7px 10px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.DialogStartNode-header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}
.DialogStartNode-body {
  padding-bottom: 7px;
}
.DialogStartNode-options-one {
  position: relative;
  border-top: 1px solid var(--imsde-node-content-inner-border-color);
  padding: 8px 0;
  display: flex;
  align-items: center;
}
.DialogStartNode-options-one-common {
  flex: 1;
}
.DialogStartNode-options-one-param {
  &:not(:last-child) {
    margin-bottom: 8px;
  }
}
.DialogStartNode-options-one-handle {
  position: relative;
}
.DialogStartNode-options-one-menu {
  opacity: 0;
  margin-right: 10px;
}
.DialogStartNode-options-one:hover .DialogStartNode-options-one-menu {
  opacity: 100%;
}
.DialogStartNode-fallback {
  position: relative;
  border-top: 1px dashed var(--imsde-node-content-inner-border-color);
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-style: italic;
  opacity: 0.7;
}
.DialogStartNode-addOption {
  font-weight: bold;
  font-size: 12px;
  padding: 8px 10px 0 10px;
  cursor: pointer;
  border-top: 1px solid var(--imsde-node-content-inner-border-color);
}
</style>
