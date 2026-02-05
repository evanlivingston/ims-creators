<template>
  <ims-input
    v-model="ownModelValue"
    class="NumberField"
    :select-on-focus="true"
    :disabled="readonly"
  >
    <template v-if="icon" #prepend>
      <div
        class="NumberField-icon"
        :class="{
          disabled: disabledEdit,
        }"
        @mousedown="toggleEditState"
      >
        <i v-if="icon.type === 'icon'" :class="icon.value"></i>
        <span v-else>{{ icon.value }}</span>
      </div>
    </template>
  </ims-input>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';

export default defineComponent({
  name: 'NumberField',
  components: {
    ImsInput,
  },
  props: {
    modelValue: {
      type: [Number, String],
      default: null,
    },
    icon: {
      type: Object as PropType<{ type: string; value: string }>,
      default: null,
    },
    step: {
      type: Number,
      default: 1,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:model-value'],
  computed: {
    ownModelValue: {
      get() {
        if (this.modelValue === 'Mixed') return this.modelValue;
        if (this.modelValue == null || this.modelValue === '') return '';
        const num = Number(this.modelValue);
        return this.formatNumber(num);
      },
      set(val: string) {
        const formatted_value = parseFloat(val);
        if (!isNaN(formatted_value)) {
          this.$emit('update:model-value', formatted_value);
        }
      },
    },
    disabledEdit() {
      return this.modelValue === 'Mixed' || this.readonly;
    },
  },
  methods: {
    formatNumber(val: number): string {
      if (isNaN(val)) return '';
      return parseFloat(val.toFixed(2)).toString();
    },
    toggleEditState(e: MouseEvent) {
      if (e.button !== 0) return;
      e.preventDefault();
      if (this.disabledEdit) return; // TODO: group editing

      document.body.style.cursor = 'ew-resize';

      const start_x = e.clientX;
      const start_value = Number(this.modelValue);
      if (isNaN(start_value)) return;

      const onMouseMove = (event: MouseEvent) => {
        const dx = event.clientX - start_x;

        let multiplier = 1;
        if (event.shiftKey) multiplier = 10;
        const new_value = start_value + dx * this.step * multiplier;
        this.$emit('update:model-value', new_value);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        document.body.style.cursor = '';
      };

      document.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseup', onMouseUp);
    },
  },
});
</script>
<style lang="scss" scoped>
.NumberField {
  font-size: 12px;
  min-width: 0;

  :deep(.is-input) {
    font-size: 12px;
  }
}
.NumberField-icon {
  color: var(--local-sub-text-color);
  margin-right: 5px;
  user-select: none;

  &:not(.disabled) {
    cursor: ew-resize;
  }
}
</style>
