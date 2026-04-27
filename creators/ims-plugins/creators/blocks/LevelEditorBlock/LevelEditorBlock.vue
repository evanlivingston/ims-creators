<template>
  <div class="LevelEditorBlock">
    <div
      v-if="levelEditorComponentLoading"
      class="LevelEditorBlock-loading loaderSpinner"
    ></div>
    <div
      v-else-if="levelEditorComponentError"
      class="LevelEditorBlock-error error-message-block"
    >
      {{ levelEditorComponentError }}
    </div>
    <screenshot-renderer
      v-else-if="levelEditorComponent"
      :disabled="displayMode !== 'print'"
      class="LevelEditorBlock-inner"
      :ready="ready"
      @rendering-done="$emit('view-ready', $event)"
    >
      <component
        :is="levelEditorComponent"
        ref="editor"
        :readonly="readonly"
        :block-controller="blockController"
        class="LevelEditorBlock-editor"
        @vue:mounted="_levelEditorComponentMountedHandler()"
      ></component>
    </screenshot-renderer>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  shallowRef,
  type Component,
  type PropType,
} from 'vue';
import type {
  AssetDisplayMode,
  ResolvedAssetBlock,
} from '~ims-app-base/logic/utils/assets';
import type { AssetChanger } from '~ims-app-base/logic/types/AssetChanger';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import ScreenshotRenderer from '~ims-app-base/components/Common/ScreenshotRenderer.vue';
import type LevelEditor from './editor/LevelEditor.vue';
import type LevelEditorBlockController from './LevelEditorBlockController';

export default defineComponent({
  name: 'LevelEditorBlock',
  components: {
    ScreenshotRenderer,
  },
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
    assetChanger: {
      type: Object as PropType<AssetChanger>,
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
    blockController: {
      type: Object as PropType<LevelEditorBlockController>,
      required: true,
    },
  },
  emits: ['view-ready'],
  data() {
    let mountResolve!: (success: boolean) => void;
    const mountPromise = new Promise<boolean>((res) => (mountResolve = res));

    return {
      levelEditorComponent: shallowRef(null as null | Component),
      levelEditorComponentLoading: true,
      levelEditorComponentError: null as null | string,
      ready: false,
      mountResolve,
      mountPromise,
    };
  },
  async mounted() {
    const component_loaded = await this.reloadComponent();
    await new Promise((res) => setTimeout(res, 100));
    this.mountResolve(component_loaded);
    this.resetListeners(true);
  },
  unmounted() {
    this.resetListeners(false);
    this.mountResolve(false);
  },
  methods: {
    async revealBlockAnchor(block_anchor: string): Promise<boolean> {
      if (!block_anchor.startsWith('shape-')) {
        return false;
      }
      const shape_id = block_anchor.slice('shape-'.length);
      const mounted = await this.mountPromise;
      if (!mounted) {
        return false;
      }
      const editor = this.$refs['editor'] as InstanceType<
        typeof LevelEditor
      > | null;
      if (!editor) {
        return false;
      }

      return await editor.showShape(shape_id);
    },
    resetListeners(init: boolean) {
      if ((this as any)._onKeydown) {
        window.removeEventListener('keydown', (this as any)._onKeydown);
        (this as any)._onKeydown = null;
      }
      if (init) {
        (this as any)._onKeydown = (e: KeyboardEvent) => {
          if (this.readonly) {
            return;
          }
          if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
            if (!this.assetChanger.isUndoRedoBusy) {
              this.$getAppManager()
                .get(UiManager)
                .doTask(async () => {
                  await this.assetChanger.undo();
                });
            }
          } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
            if (!this.assetChanger.isUndoRedoBusy) {
              this.$getAppManager()
                .get(UiManager)
                .doTask(async () => {
                  await this.assetChanger.redo();
                });
            }
          }
        };

        window.addEventListener('keydown', (this as any)._onKeydown);
      }
    },
    async reloadComponent() {
      this.levelEditorComponentLoading = true;
      this.levelEditorComponentError = null;
      try {
        this.levelEditorComponent = (
          await import('./editor/LevelEditor.vue')
        ).default;
        return true;
      } catch (err: any) {
        this.levelEditorComponentError = err.message;
        return false;
      } finally {
        this.levelEditorComponentLoading = false;
      }
    },
    async _levelEditorComponentMountedHandler() {
      await this.$nextTick();
      this.ready = true;
    },
  },
});
</script>
<style lang="scss" rel="stylesheet/scss" scoped>
.LevelEditorBlock-inner {
  height: 100%;
}
</style>
