<template>
  <menu-button class="DialogSpeechNodeAttachCover">
    <template #button="{ show }">
      <button
        ref="addButton"
        class="DialogSpeechNodeAttachCover-button is-button is-button-icon"
        :title="$t('imsDialogEditor.speech.attachCover')"
        :disabled="uploading"
        @click="show"
      >
        <span v-if="uploading" class="loaderSpinner"></span>
        <i v-else class="ri-image-fill"></i>
      </button>
    </template>
    <menu-list :menu-list="addCoverMenu"></menu-list>
  </menu-button>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import type { AssetPropValueFile } from '~ims-app-base/logic/types/Props';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import type { IProjectContext } from '~ims-app-base/logic/types/IProjectContext';
import { assert } from '~ims-app-base/logic/utils/typeUtils';
import { getClipboardImagesContent } from '~ims-app-base/logic/utils/clipboard';
import EditorSubContext from '~ims-app-base/logic/managers/EditorManager';

const AllowedExtensions = new Set(['jpg', 'jpeg', 'png', 'bmp', 'svg', 'gif']);

export default defineComponent({
  name: 'DialogSpeechNodeAttachCover',
  components: {
    MenuButton,
    MenuList,
  },
  inject: ['projectContext'],
  props: {
    modelValue: {
      type: [null, Object] as PropType<AssetPropValueFile | null>,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      uploading: false,
    };
  },
  computed: {
    projectContextInjected(): IProjectContext {
      assert(this.projectContext, 'Project context is not providded');
      return this.projectContext as IProjectContext;
    },
    addCoverMenu() {
      return [
        {
          title: this.$t('assetEditor.galleryBlockAddFileFromComputer'),
          action: () => this.selectFiles(),
          icon: 'file',
        },
        {
          title: this.$t('assetEditor.galleryBlockPasteFromBuffer'),
          action: () => this.getFileFromBuffer(),
          icon: 'ri-clipboard-line',
        },
      ];
    },
  },
  methods: {
    async selectFiles() {
      const files = await this.$getAppManager()
        .get(EditorSubContext)
        .pickFiles({
          accept: [...AllowedExtensions].map((x) => `.${x}`).join(','),
        });
      if (!files || files.length !== 1) return;

      await this.attachFile(files[0]);
    },
    async attachFile(file: { blob: Blob; name: string }) {
      await this.$getAppManager()
        .get(UiManager)
        .doTask(async () => {
          const ext = file.name.split('.').pop();

          if (!ext || !AllowedExtensions.has(ext.toLowerCase())) {
            throw new Error(
              this.$t('file.errorUnsupportedFormat', {
                file: file.name,
              }),
            );
          }

          this.uploading = true;
          try {
            const upload_job = this.$getAppManager()
              .get(EditorSubContext)
              .attachFile(file.blob, file.name);
            const res = await upload_job.awaitResult();
            this.$emit('update:modelValue', res);
          } finally {
            this.uploading = false;
          }
        });
    },
    async getFileFromBuffer() {
      this.$getAppManager()
        .get(UiManager)
        .doTask(async () => {
          const files: { blob: Blob; name: string }[] =
            await getClipboardImagesContent();
          if (files.length === 0) {
            throw Error(
              this.$t('assetEditor.galleryBlockPasteFromBufferEmpty'),
            );
          }
          await this.attachFile(files[0]);
        });
    },
  },
});
</script>

<style lang="scss" scoped></style>
