<template>
  <div class="DataFieldDisplay">
    <DataFieldInput
      v-if="dataType"
      :data-type="dataType"
      :model-value="modelValue"
      :readonly="true"
    ></DataFieldInput>
    <imc-presenter v-else :value="modelValue"></imc-presenter>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type {
  AssetPropValueType,
  AssetPropValue,
} from '~ims-app-base/logic/types/Props';
import ImcPresenter from '~ims-app-base/components/ImcText/ImcPresenter.vue';
import DataFieldInput from './DataFieldInput.vue';

export default defineComponent({
  name: 'DataFieldDisplay',
  components: {
    ImcPresenter,
    DataFieldInput,
  },
  props: {
    modelValue: {
      type: [Object, String, Boolean, Number, null] as PropType<AssetPropValue>,
      default: null,
    },
    dataType: {
      type: [Object, null] as PropType<AssetPropValueType | null>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped></style>
