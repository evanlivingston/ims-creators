<template>
  <div class="TextGridBlockItem">
    <imc-presenter :value="link.content"></imc-presenter>
    <button
      v-if="!readonly"
      class="TextGridBlockItem-edit is-button accent"
      @click="$emit('edit', link)"
    >
      <i class="ri-pencil-fill"></i>
    </button>
  </div>
</template>

<script lang="ts">
import { type PropType, defineComponent } from 'vue';
import type { TextGridItem } from './TextGridBlock';
import ImcPresenter from '~ims-app-base/components/ImcText/ImcPresenter.vue';

export default defineComponent({
  name: 'TextGridBlockItem',
  components: {
    ImcPresenter,
  },
  props: {
    link: {
      type: Object as PropType<TextGridItem>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['edit'],
  data() {
    return {};
  },
  computed: {},
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
.TextGridBlockItem {
  position: relative;
}

.TextGridBlockItem-link-different {
  font-style: italic;
  color: #999;
}

.TextGridBlockItem-edit {
  position: absolute;
  right: 0;
  top: 0;
  padding: 0;
  font-size: 18px;
  display: none;
  line-height: 24px;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  text-align: center;
  cursor: pointer;
}

.TextGridBlockItem:hover {
  .TextGridBlockItem-edit {
    display: block;
  }
}
</style>
