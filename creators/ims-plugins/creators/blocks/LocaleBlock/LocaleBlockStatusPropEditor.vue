<template>
  <div class="LocaleBlockStatusPropEditor">
    <button
      v-if="statusValue === 'needReview' || statusValue === 'changed'"
      class="is-button is-button-icon LocaleBlockStatusPropEditor-button"
      :title="statusTitle + '\n\n' + $t('localization.statusClickToConfirm')"
      @click="confirm"
    >
      <locale-block-status-icon
        :status="statusValue"
      ></locale-block-status-icon>
    </button>
    <span
      v-else
      class="LocaleBlockStatusPropEditor-static"
      :title="statusTitle"
    >
      <locale-block-status-icon
        :status="statusValue"
      ></locale-block-status-icon>
    </span>
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
import type { LocalBlockLocaleStatus } from './LocaleBlock';
import LocaleBlockStatusIcon from './LocaleBlockStatusIcon.vue';

export default defineComponent({
  name: 'LocaleBlockStatusPropEditor',
  components: {
    LocaleBlockStatusIcon,
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
    statusValue(): LocalBlockLocaleStatus {
      return castAssetPropValueToString(
        this.formState.combined.status,
      ) as LocalBlockLocaleStatus;
    },
    statusTitle() {
      return this.$t('localization.status.' + this.statusValue);
    },
  },
  methods: {
    confirm() {
      this.$emit('update:modelValue', true);
    },
  },
});
</script>

<style lang="scss" scoped>
.LocaleBlockStatusPropEditor {
  padding: 2px;
}
.LocaleBlockStatusPropEditor-button,
.LocaleBlockStatusPropEditor-static {
  padding: 4px;
  display: block;
}
</style>
