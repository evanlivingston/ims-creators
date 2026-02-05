<template>
  <div class="ButtonsField">
    <button
      v-for="option of options"
      :key="option.key"
      class="is-button is-button-icon ButtonsField-button"
      :title="$t('levelEditor.properties.actions.' + option.key)"
      :class="{
        selected: modelValue === option.value,
      }"
      :disabled="readonly"
      @click="onClick(option.value)"
    >
      <i :class="option.icon"></i>
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { ButtonsFieldOption } from './ButtonsField';

export default defineComponent({
  name: 'ButtonsField',
  props: {
    modelValue: {
      type: String,
      default: 'left',
    },
    options: {
      type: Array as PropType<ButtonsFieldOption[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:model-value'],
  methods: {
    onClick(key: string) {
      this.$emit('update:model-value', key);
    },
  },
});
</script>
<style lang="scss" scoped>
.ButtonsField {
  display: flex;
  flex-direction: row;
}
.ButtonsField-button {
  &.selected {
    --button-bg-color: var(--button-bg-color-hover) !important;
  }
}
</style>
