<template>
  <Handle :id="id" class="ExecHandle" :type="type" :position="position">
    <svg
      class="ExecHandle-svg"
      viewBox="0 0 20 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      fill="#555555"
      stroke="#ffffff"
      style="stroke-width: 0.744504"
    >
      <path
        d="M 0.37225208,0.37225208 H 11.627748 L 20,6 11.627748,11.627748 H 0.37225208 Z"
      />
    </svg>
  </Handle>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { type Position, Handle, type HandleType } from '@vue-flow/core';

export default defineComponent({
  name: 'ExecHandle',
  components: {
    Handle,
  },
  props: {
    id: { type: String, default: '' },
    type: { type: String as PropType<HandleType> },
    position: { type: String as PropType<Position> },
  },
});
</script>

<style lang="scss" scoped>
.ExecHandle {
  background: none;
  border-radius: 0;
  border: none;
}
.ExecHandle,
.ExecHandle-svg {
  width: 12px;
  height: 12px;
  display: block;
}

.ExecHandle:hover .ExecHandle-svg {
  stroke: #999;
  fill: #efefef;
}

.ExecHandle-svg {
  user-select: none;
  pointer-events: none;
}
</style>
