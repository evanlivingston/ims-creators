<template>
  <div class="DialogEndNode DialogEditorNode">
    <div
      class="DialogEndNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <ExecHandle id="in" type="target" :position="Position.Left" />
      <i :class="nodeDescriptor.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';

export default defineComponent({
  name: 'DialogEndNode',
  components: {
    ExecHandle,
  },
  props: {
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    Position() {
      return Position;
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogEndNode-header {
  padding: 7px 10px;
  font-size: 14px;
}
</style>
