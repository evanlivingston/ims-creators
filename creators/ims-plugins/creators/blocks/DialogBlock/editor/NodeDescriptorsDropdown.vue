<template>
  <div class="NodeDescriptorsDropdown is-dropdown">
    <div
      v-for="option of nodeDescriptors"
      :key="option.name"
      class="NodeDescriptorsDropdown-item"
      :style="{
        '--imsde-node-color': option.color,
      }"
      :title="$t(`imsDialogEditor.nodes.${option.name}.description`)"
      @click="chooseOption(option)"
    >
      <i class="NodeDescriptorsDropdown-item-icon" :class="option.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${option.name}.title`) }}
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { NodeDescriptor } from '../nodes/NodeDescriptor';

export default defineComponent({
  name: 'NodeDescriptorsDropdown',
  props: {
    nodeDescriptors: {
      type: Array as PropType<NodeDescriptor[]>,
      required: true,
    },
  },
  emits: ['choose'],
  methods: {
    chooseOption(opt: NodeDescriptor) {
      this.$emit('choose', opt);
    },
  },
});
</script>
<style lang="scss" scoped>
.NodeDescriptorsDropdown {
  background-color: var(--imsde-dropdown-bg-color);
  border-radius: var(--imsde-dropdown-border-radius);
  box-shadow: var(--imsde-dropdown-box-shadow);
  max-height: var(--DropdownContainer-freeHeight);
  width: max-content;
  max-width: var(--DropdownContainer-freeWidth);
  user-select: none;
}
.NodeDescriptorsDropdown-item {
  padding: 5px 10px;
  cursor: pointer;

  &:not(:last-child) {
    border-bottom: 1px solid var(--imsde-dropdown-border-color);
  }

  &:hover {
    color: var(--imsde-dropdown-text-color);
    background: var(--imsde-node-color);
    .NodeDescriptorsDropdown-item-icon {
      color: var(--imsde-dropdown-text-color);
    }
  }
}
.NodeDescriptorsDropdown-item-icon {
  color: var(--imsde-node-color);
}
</style>
