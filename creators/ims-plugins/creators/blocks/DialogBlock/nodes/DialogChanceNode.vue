<template>
  <div class="DialogChanceNode DialogEditorNode">
    <div
      class="DialogChanceNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <ExecHandle id="in" type="target" :position="Position.Left" />
      <i :class="nodeDescriptor.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
    </div>
    <div class="DialogChanceNode-body DialogEditorNode-body">
      <div class="DialogChanceNode-content">
        <div
          v-for="(option, index) of options"
          :key="index"
          class="DialogChanceNode-option"
        >
          <input
            class="DialogChanceNode-option-weight"
            type="number"
            min="1"
            :value="option.values?.weight ?? 1"
            :readonly="readonly"
            @change="onWeightChange(index, $event)"
          />
          <ExecHandle
            :id="'out-' + (index + 1)"
            type="source"
            :position="Position.Right"
          />
        </div>
        <button
          v-if="!readonly"
          class="DialogChanceNode-addOption"
          @click="addOption"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';
import type { NodeDataController } from '../editor/NodeDataController';
import type { ScriptPlayNode } from '../play/ScriptPlayNode';

export default defineComponent({
  name: 'DialogChanceNode',
  components: {
    ExecHandle,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    nodeDataController: {
      type: Object as PropType<NodeDataController>,
      required: true,
    },
    playingNodeData: {
      type: [Object, null] as PropType<ScriptPlayNode> | null,
      default: null,
    },
  },
  computed: {
    Position() {
      return Position;
    },
    options() {
      return this.nodeDataController.options;
    },
  },
  methods: {
    onWeightChange(index: number, event: Event) {
      const input = event.target as HTMLInputElement;
      const weight = Math.max(1, parseInt(input.value, 10) || 1);
      this.nodeDataController.setOptionValue(index, 'weight', weight);
    },
    addOption() {
      const newIndex = this.nodeDataController.addOption();
      this.nodeDataController.setOptionValue(newIndex, 'weight', 1);
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogChanceNode-header {
  padding: 7px 10px;
  font-size: 14px;
}
.DialogChanceNode-body {
  padding: 7px 0;
  display: flex;
}
.DialogChanceNode-content {
  flex: 1;
}
.DialogChanceNode-addOption {
  font-weight: bold;
  font-size: 12px;
  margin-left: 10px;
  cursor: pointer;
  background: none;
  border: none;
  color: inherit;
  padding: 2px 8px;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}
.DialogChanceNode-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}
.DialogChanceNode-option-weight {
  width: 48px;
  padding: 2px 6px;
  margin-left: 10px;
  font-size: 12px;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 3px;
  background: transparent;
  color: inherit;
  text-align: center;
}
</style>
