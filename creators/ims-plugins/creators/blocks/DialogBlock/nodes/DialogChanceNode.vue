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
        <div class="DialogChanceNode-option">
          <div class="DialogChanceNode-option-caption">50%</div>
          <ExecHandle id="out-1" type="source" :position="Position.Right" />
        </div>
        <div class="DialogChanceNode-option">
          <div class="DialogChanceNode-option-caption">&nbsp;</div>
          <ExecHandle id="out-2" type="source" :position="Position.Right" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';

export default defineComponent({
  name: 'DialogChanceNode',
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
  data() {
    return {};
  },
  computed: {
    Position() {
      return Position;
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
}
.DialogChanceNode-option {
  position: relative;
}
.DialogChanceNode-option-caption {
  padding: 0 10px;
}
</style>
