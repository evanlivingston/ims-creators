<template>
  <div class="TextGridBlock">
    <div
      v-if="cells.length > 0"
      class="TextGridBlock-content"
      :style="{ 'grid-template-columns': gridTemplateColumns }"
    >
      <text-grid-block-item
        v-for="cell of cells"
        :key="cell.key"
        class="TextGridBlock-content-one"
        :link="cell"
        :readonly="readonly"
        @edit="editCell(cell)"
      >
      </text-grid-block-item>
    </div>
    <div v-if="!readonly" class="TextGridBlock-add use-buttons-action">
      <button class="is-button" @click="addTextCell">
        {{ $t('mainMenu.add') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { type PropType, defineComponent } from 'vue';
import type { ResolvedAssetBlock } from '~ims-app-base/logic/utils/assets';
import TextGridBlockItem from './TextGridBlockItem.vue';
import type { AssetBlockEditorVM } from '~ims-app-base/logic/vm/AssetBlockEditorVM';
import type { EditorBlockHandler } from '~ims-app-base/components/Asset/Editor/EditorBlock';
import {
  extractTextGridBlockEntries,
  type TextGridItem,
} from './TextGridBlock';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import AddTextCellDialog from './AddTextCellDialog.vue';
import { v4 as uuidv4 } from 'uuid';
import { getNextIndexWithTimestamp } from '~ims-app-base/components/Asset/Editor/blockUtils';
import TextGridBlockSettingsDialog from './TextGridBlockSettingsDialog.vue';
import {
  castAssetPropValueToInt,
  isPropInherited,
  makeBlockRef,
  sameAssetPropValues,
} from '~ims-app-base/logic/types/Props';
import type { AssetChanger } from '~ims-app-base/logic/types/AssetChanger';

export default defineComponent({
  name: 'TextGridBlock',
  components: {
    TextGridBlockItem,
  },
  props: {
    assetBlockEditor: {
      type: Object as PropType<AssetBlockEditorVM>,
      required: true,
    },
    resolvedBlock: {
      type: Object as PropType<ResolvedAssetBlock>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    assetChanger: {
      type: Object as PropType<AssetChanger>,
      required: true,
    },
    editorBlockHandler: {
      type: Object as PropType<EditorBlockHandler>,
      required: true,
    },
  },
  emits: ['save', 'discard'],
  data() {
    return {
      entryRefs: new Map<string, any>(),
    };
  },
  computed: {
    entries() {
      return extractTextGridBlockEntries(this.resolvedBlock);
    },
    cells(): TextGridItem[] {
      return this.entries.list;
    },
    editMode() {
      return this.assetBlockEditor.isBlockEditing(this.resolvedBlock.id);
    },
    current(): {
      value: number | null;
      same: boolean;
      inherited: boolean;
    } {
      const value = castAssetPropValueToInt(
        this.resolvedBlock.computed['columns'],
      );
      const prop_inherited = this.resolvedBlock.inherited
        ? isPropInherited(
            'columns',
            this.resolvedBlock.props,
            this.resolvedBlock.inherited,
          )
        : false;
      const inherited =
        prop_inherited && this.resolvedBlock.props['columns'] === undefined;
      const same = true;
      return {
        value,
        same,
        inherited,
      };
    },
    gridTemplateColumns() {
      const cnt = this.current.value ? this.current.value : 4;
      let str = '1fr';
      for (let i = 1; i < cnt; i++) {
        str += ' 1fr';
      }
      return str;
    },
  },
  unmounted() {},
  methods: {
    async enterEditMode(ev?: MouseEvent, _useMouseCoord: boolean = false) {
      if (this.readonly) return;
      if (this.editMode) return;
      this.assetBlockEditor.enterEditMode(this.resolvedBlock.id);
      const res = await this.$getAppManager()
        .get(DialogManager)
        .show(TextGridBlockSettingsDialog, {
          columnsCount: this.current.value ? this.current.value : 4,
        });
      if (res) {
        this.emitValue(res.columnsCount);
        this.save();
      } else {
        this.$emit('discard');
        this.assetBlockEditor.exitEditMode();
      }
    },
    save() {
      this.$emit('save');
      this.assetBlockEditor.exitEditMode();
    },
    emitValue(columnsCount: number) {
      if (!sameAssetPropValues(this.current.value, columnsCount)) {
        this.assetChanger.setBlockPropKey(
          this.resolvedBlock.assetId,
          makeBlockRef(this.resolvedBlock),
          null,
          'columns',
          Math.max(columnsCount, 2),
        );
      }
    },
    async addTextCell() {
      this.assetBlockEditor.enterEditMode(this.resolvedBlock.id);
      const new_cell = await this.$getAppManager()
        .get(DialogManager)
        .show(AddTextCellDialog, {
          content: null,
          isNew: true,
        });
      this.assetBlockEditor.exitEditMode();
      if (!new_cell) return;
      const new_index = getNextIndexWithTimestamp(this.entries.maxIndex);
      const new_key = uuidv4();
      this.assetChanger.setBlockPropKeys(
        this.resolvedBlock.assetId,
        makeBlockRef(this.resolvedBlock),
        null,
        {
          [`${new_key}\\content`]: new_cell.content,
          [`${new_key}\\index`]: new_index,
        },
      );
      await this.editorBlockHandler.save();
    },
    moveCell(link: TextGridItem, offset: number) {
      const current_index = link.index;
      const key_indices: { key: string; index: number; di: number }[] = [];
      for (const other_cell of this.cells) {
        const index = other_cell.index;
        let di: number;
        if (offset < 0) di = current_index - index;
        else di = index - current_index;
        if (di > 0) {
          key_indices.push({
            key: other_cell.key,
            index: index,
            di,
          });
        }
      }
      if (key_indices.length > 0) {
        key_indices.sort((a, b) => a.di - b.di);
        const op = this.assetChanger.makeOpId();
        this.assetChanger.setBlockPropKey(
          this.resolvedBlock.assetId,
          makeBlockRef(this.resolvedBlock),
          null,
          `${link.key}\\index`,
          key_indices[0].index,
          op,
        );
        this.assetChanger.setBlockPropKey(
          this.resolvedBlock.assetId,
          makeBlockRef(this.resolvedBlock),
          null,
          `${key_indices[0].key}\\index`,
          current_index,
          op,
        );
      }
    },
    async editCell(link: TextGridItem) {
      this.assetBlockEditor.enterEditMode(this.resolvedBlock.id);
      const change_link = await this.$getAppManager()
        .get(DialogManager)
        .show(AddTextCellDialog, {
          content: link.content,
          isNew: false,
        });
      this.assetBlockEditor.exitEditMode();
      if (!change_link) return;

      if (change_link.delete) {
        this.assetChanger.deleteBlockPropKey(
          this.resolvedBlock.assetId,
          makeBlockRef(this.resolvedBlock),
          null,
          link.key,
        );
      } else {
        this.assetChanger.setBlockPropKey(
          this.resolvedBlock.assetId,
          makeBlockRef(this.resolvedBlock),
          null,
          `${link.key}\\content`,
          change_link.content,
        );
        if (change_link.moveUp) {
          this.moveCell(link, -1);
        } else if (change_link.moveDown) {
          this.moveCell(link, 1);
        }
      }
      await this.editorBlockHandler.save();
    },
  },
});
</script>

<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/devices-mixins';

.TextGridBlock {
  background-color: var(--local-bg-color);
  border: 1px solid var(--local-bg-color);
  border-radius: 4px;
  color: var(--local-text-color);
  padding: 15px 10px;

  &.state-edit {
    border-color: var(--color-main-yellow);
  }
}

.TextGridBlock-content {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  align-items: flex-start;

  @include devices-mixins.device-type(not-pc) {
    grid-template-columns: 1fr;
  }
}

.TextGridBlock-add {
  margin-top: 20px;
}
</style>
