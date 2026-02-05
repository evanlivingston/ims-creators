<template>
  <div
    v-if="status === 'new'"
    class="LocaleBlockStatusIcon LocaleBlockStatusIcon-new"
  ></div>
  <div
    v-else-if="status === 'changed'"
    class="LocaleBlockStatusIcon LocaleBlockStatusIcon-changed"
  ></div>
  <div
    v-else-if="status === 'needReview'"
    class="LocaleBlockStatusIcon LocaleBlockStatusIcon-needReview"
  ></div>
  <div
    v-else-if="status === 'done'"
    class="LocaleBlockStatusIcon LocaleBlockStatusIcon-done"
  >
    <i class="ri-check-fill"></i>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import type { LocalBlockLocaleStatus } from './LocaleBlock';

export default defineComponent({
  name: 'LocaleBlockStatusIcon',
  components: {},
  props: {
    status: {
      type: String as PropType<LocalBlockLocaleStatus>,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped>
.LocaleBlockStatusIcon-new,
.LocaleBlockStatusIcon-changed,
.LocaleBlockStatusIcon-needReview {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 4px;
}
.LocaleBlockStatusIcon-new {
  background: var(--local-sub-text-color);
}
.LocaleBlockStatusIcon-changed {
  background: var(--color-accent);
}
.LocaleBlockStatusIcon-needReview {
  background: var(--color-ready-value);
}
.LocaleBlockStatusIcon-done {
  color: var(--color-ready-value);
  font-size: 20px;
  line-height: 20px;
}
</style>
