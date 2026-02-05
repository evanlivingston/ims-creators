<template>
  <div class="MarkdownBlock">
    <div
      v-if="markdownEditorComponentLoading"
      class="MarkdownBlock-loading loaderSpinner"
    ></div>
    <div
      v-else-if="markdownEditorComponentError"
      class="MarkdownBlock-error error-message-block"
    >
      {{ markdownEditorComponentError }}
    </div>
    <component
      :is="markdownEditorComponent"
      v-else-if="markdownEditorComponent"
      ref="editor"
      :readonly="readonly"
      :model-value="currentValue"
      class="MarkdownBlock-editor"
      @update:model-value="emitValue($event)"
      @focus="enterEditMode()"
      @blur="save()"
    ></component>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  shallowRef,
  type Component,
  type PropType,
} from 'vue';
import type { AssetChanger } from '~ims-app-base/logic/types/AssetChanger';
import type { AssetBlockEditorVM } from '~ims-app-base/logic/vm/AssetBlockEditorVM';
import type { EditorBlockHandler } from '~ims-app-base/components/Asset/EditorBlock';
import type {
  AssetDisplayMode,
  ResolvedAssetBlock,
} from '~ims-app-base/logic/utils/assets';
import type { DialogBlockController } from '../DialogBlock/editor/DialogBlockController';
import {
  setImsClickOutside,
  type SetClickOutsideCancel,
} from '~ims-app-base/components/utils/ui';
import { makeBlockRef } from '~ims-app-base/logic/types/Props';
import type MarkdownEditor from './editor/MarkdownEditor.vue';

export default defineComponent({
  name: 'MarkdownBlock',
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    assetChanger: {
      type: Object as PropType<AssetChanger>,
      required: true,
    },
    assetBlockEditor: {
      type: Object as PropType<AssetBlockEditorVM>,
      required: true,
    },
    editorBlockHandler: {
      type: Object as PropType<EditorBlockHandler>,
      required: true,
    },
    resolvedBlock: {
      type: Object as PropType<ResolvedAssetBlock>,
      required: true,
    },
    displayMode: {
      type: String as PropType<AssetDisplayMode>,
      default: () => 'normal',
    },
    requestToolbarTarget: {
      type: Function as PropType<() => Promise<HTMLElement | null>>,
      required: true,
    },
    blockController: {
      type: Object as PropType<DialogBlockController>,
      required: true,
    },
  },
  data() {
    let mountResolve!: (success: boolean) => void;
    const mountPromise = new Promise<boolean>((res) => (mountResolve = res));

    return {
      markdownEditorComponent: shallowRef(null as null | Component),
      markdownEditorComponentLoading: true,
      markdownEditorComponentError: null as null | string,
      clickOutside: null as SetClickOutsideCancel | null,
      mountPromise,
      mountResolve,
    };
  },
  computed: {
    currentValue() {
      return this.resolvedBlock.computed['value'];
    },
  },

  async mounted() {
    const component_loaded = await this.reloadComponent();
    await new Promise((res) => setTimeout(res, 100));
    this.mountResolve(component_loaded);
  },
  methods: {
    onFocus() {},
    emitValue(text: string) {
      this.assetChanger.setBlockPropKey(
        this.resolvedBlock.assetId,
        makeBlockRef(this.resolvedBlock),
        null,
        'value',
        text,
      );
    },
    async enterEditMode() {
      if (this.readonly) return;
      await this.mountPromise;

      const editor = this.$refs['editor'] as InstanceType<
        typeof MarkdownEditor
      > | null;
      if (editor) {
        editor.focus();
      }

      // if (this.editMode) return;

      this.assetBlockEditor.enterEditMode(this.resolvedBlock.id);
      this.resetGlobalClickOutside(true);
    },
    async save() {
      if (this.readonly) return;

      await this.editorBlockHandler.save();
      this.assetBlockEditor.exitEditMode();
      this.resetGlobalClickOutside(false);
    },
    resetGlobalClickOutside(restart: boolean) {
      if (this.clickOutside) {
        this.clickOutside();
        this.clickOutside = null;
      }
      if (restart) {
        this.clickOutside = setImsClickOutside(this.$el, () => {
          this.save();
        });
      }
    },
    async reloadComponent() {
      this.markdownEditorComponentLoading = true;
      this.markdownEditorComponentError = null;
      try {
        this.markdownEditorComponent = (
          await import('./editor/MarkdownEditor.vue')
        ).default;
        return true;
      } catch (err: any) {
        this.markdownEditorComponentError = err.message;
        return false;
      } finally {
        this.markdownEditorComponentLoading = false;
      }
    },
  },
});
</script>
<style lang="scss" scoped>
.MarkdownBlock-editor {
  width: 100%;
  height: 100%;
}
</style>
