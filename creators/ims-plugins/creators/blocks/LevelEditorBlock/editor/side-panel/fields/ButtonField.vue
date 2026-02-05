<template>
  <button
    class="is-button is-button-text ButtonField"
    :disabled="readonly"
    @click="$emit('update:model-value', true)"
  >
    <div v-if="icon" class="ButtonField-icon">
      <i :class="icon"></i>
    </div>
    <div class="ButtonField-label">
      {{ $t('levelEditor.properties.fields.' + label) }}
    </div>
  </button>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ButtonField',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:model-value'],
});
</script>
<style lang="scss" scoped>
.ButtonField.is-button {
  width: 100%;
  gap: 10px;
  --button-padding: 5px;
}
.ButtonField-icon {
  font-size: 15px;
}
.ButtonField-label {
  font-size: 13px;
}
</style>
