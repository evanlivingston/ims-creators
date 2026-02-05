<template>
  <asset-block-full-height-editor
    ref="editor"
    class="MarkdownEditor"
    :asset-block-editor="assetBlockEditor"
    :request-root-toolbar-target="async () => null"
  ></asset-block-full-height-editor>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AssetBlockEditorVM } from '~ims-app-base/logic/vm/AssetBlockEditorVM';
import AssetBlockFullHeightEditor from '~ims-app-base/components/Asset/Editor/AssetBlockFullHeightEditor.vue';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

export default defineComponent({
  name: 'MarkdownEditor',
  components: {
    AssetBlockFullHeightEditor,
  },
  props: {
    assetBlockEditor: {
      type: Object as PropType<AssetBlockEditorVM>,
      required: true,
    },
  },
  methods: {
    async revealAssetBlock(blockId: string, anchor?: string): Promise<boolean> {
      if (!this.$el) {
        return false;
      }
      if (!anchor) return false;

      const element = window.document.getElementById('h-' + anchor);
      if (!element) {
        return false;
      }

      scrollIntoViewIfNeeded(element as HTMLElement, {
        behavior: 'smooth',
        scrollMode: 'if-needed',
      });

      return true;
    },
  },
});
</script>
<style lang="scss" scoped>
.MarkdownEditor {
  padding: 0 var(--root-editor-block-padding-right) 0
    var(--root-editor-block-padding-left);
}
</style>
