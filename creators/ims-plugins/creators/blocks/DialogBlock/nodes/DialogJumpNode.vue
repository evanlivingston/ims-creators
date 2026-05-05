<template>
  <div class="DialogJumpNode DialogEditorNode">
    <div
      class="DialogJumpNode-header DialogNode-header DialogEditorNode-header"
      :title="$t(`imsDialogEditor.nodes.${nodeDescriptor.name}.description`)"
    >
      <ExecHandle id="in" type="target" :position="Position.Left" />
      <i :class="nodeDescriptor.icon"></i>
      {{ $t(`imsDialogEditor.nodes.${nodeDescriptor.name}.title`) }}
    </div>
    <div class="DialogJumpNode-body DialogEditorNode-body">
      <div class="DialogJumpNode-picker">
        <AssetSelectorPropEditor
          v-if="!readonly"
          class="DialogJumpNode-picker-input"
          :model-value="dialogueValue"
          :where="dialogueAssetWhere"
          :allow-custom="true"
          :nullable="true"
          :placeholder="$t('imsDialogEditor.jump.pickDialogue')"
          @update:model-value="onDialogueSelected($event)"
        />
        <span v-else class="DialogJumpNode-picker-readonly">
          {{ dialogueName || $t('imsDialogEditor.jump.pickDialogue') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { Position } from '@vue-flow/core';
import type { NodeDescriptor } from './NodeDescriptor';
import ExecHandle from '../parts/ExecHandle.vue';
import type { NodeDataController } from '../editor/NodeDataController';
import AssetSelectorPropEditor from '~ims-app-base/components/Props/AssetSelectorPropEditor.vue';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { AssetPropValue } from '~ims-app-base/logic/types/Props';

const DIALOGUE_TYPE_ID = 'a9afe517-a79f-4753-9e34-3a39fde65766';

export default defineComponent({
  name: 'DialogJumpNode',
  components: {
    ExecHandle,
    AssetSelectorPropEditor,
  },
  props: {
    nodeDescriptor: {
      type: Object as PropType<NodeDescriptor>,
      required: true,
    },
    nodeDataController: {
      type: Object as PropType<NodeDataController>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    Position() {
      return Position;
    },
    dialogueAssetWhere() {
      return {
        workspaceids:
          this.$getAppManager()
            .get(ProjectManager)
            .getWorkspaceIdByName('gdd') ?? null,
        typeids: DIALOGUE_TYPE_ID,
      };
    },
    dialogueValue(): AssetPropValue {
      const val = this.nodeDataController.values['dialogue'];
      return (val as AssetPropValue) ?? null;
    },
    dialogueName(): string {
      const val = this.nodeDataController.values['dialogue'];
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object') {
        const obj = val as { Title?: string; Str?: string };
        return obj.Title ?? obj.Str ?? '';
      }
      return String(val);
    },
  },
  methods: {
    onDialogueSelected(val: AssetPropValue | null) {
      this.nodeDataController.setValue('dialogue', val ?? null);
    },
  },
});
</script>

<style lang="scss" scoped>
.DialogJumpNode-header {
  padding: 7px 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.DialogJumpNode-body {
  padding: 8px 10px;
  min-width: 180px;
}
.DialogJumpNode-picker-input {
  width: 100%;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--imsde-node-content-inner-border-color);
  border-radius: 2px;
  padding: 2px 4px;
  color: inherit;
  &:focus {
    outline: none;
    border-color: var(--imsde-node-playing-color, #888);
  }
}
.DialogJumpNode-picker-readonly {
  font-size: 12px;
  font-style: italic;
  opacity: 0.7;
}
</style>
