<template>
  <div class="LocaleBlockKeyPropPresenter">
    <div class="LocaleBlockKeyPropPresenter-key">{{ keyValue }}</div>
    <div class="LocaleBlockKeyPropPresenter-title">
      <caption-string :value="titleValue"></caption-string>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import {
  castAssetPropValueToString,
  type AssetPropValue,
} from '~ims-app-base/logic/types/Props';
import type { PropsFormState } from '~ims-app-base/logic/types/PropsForm';
import CaptionString from '~ims-app-base/components/Common/CaptionString.vue';

export default defineComponent({
  name: 'LocaleBlockKeyPropPresenter',
  components: {
    CaptionString,
  },
  props: {
    modelValue: {
      type: [Object, String, Number, Boolean] as PropType<AssetPropValue>,
      default: null,
    },
    formState: {
      type: Object as PropType<PropsFormState>,
      required: true,
    },
  },
  emits: ['update:modelValue', 'blur', 'preEnter', 'enter', 'changeProps'],
  computed: {
    keyValue() {
      return this.formState.combined.key;
    },
    titleValue() {
      return castAssetPropValueToString(this.formState.combined.title);
    },
  },
  methods: {},
});
</script>

<style lang="scss" scoped>
.LocaleBlockKeyPropPresenter {
  padding: 5px;
}
.LocaleBlockKeyPropPresenter-key {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
}
.LocaleBlockKeyPropPresenter-title {
  font-size: 10px;
  color: var(--local-sub-text-color);
}
</style>
