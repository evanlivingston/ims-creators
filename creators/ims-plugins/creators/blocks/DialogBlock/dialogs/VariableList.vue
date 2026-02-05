<template>
  <div v-if="variableList.length > 0" class="VariableList-list">
    <sortable-list
      handle-selector=".VariableListItem-row-drag"
      id-key="name"
      :list="variableList"
      @update:list="changeList($event)"
    >
      <template #default="{ item }">
        <variable-list-item
          class="VariableList-row"
          :variable-controller="variableController"
          :variable="item"
          :show-auto-fill="showAutoFill"
        >
        </variable-list-item>
      </template>
    </sortable-list>
  </div>
  <div v-else class="VariableList-empty">
    {{ $t('imsDialogEditor.var.noVariablesYet') }}
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import isUUID from 'validator/es/lib/isUUID';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import { AssetPropType } from '~ims-app-base/logic/types/Props';
import type { IDialogVariableController } from '../editor/DialogVariableController';
import VariableListItem from './VariableListItem.vue';
import SortableList from '~ims-app-base/components/Common/SortableList.vue';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import type { ScriptBlockPlainVariable } from '../logic/nodeStoring';

export default defineComponent({
  name: 'VariableList',
  components: {
    VariableListItem,
    SortableList,
  },
  props: {
    variableController: {
      type: Object as PropType<IDialogVariableController>,
      required: true,
    },
    showAutoFill: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    variableList() {
      return this.variableController.getVariables();
    },
  },
  async mounted() {
    await this.loadVariablesAssetKinds();
  },
  methods: {
    async changeList(reordered_variables: ScriptBlockPlainVariable[]) {
      await this.$getAppManager()
        .get(UiManager)
        .doTask(async () => {
          this.variableController.reorderVariables(reordered_variables);
        });
    },
    async loadVariablesAssetKinds() {
      const asset_ids: string[] = [];
      for (const variable of this.variableList) {
        if (!variable.type || variable.type.Type !== AssetPropType.ASSET) {
          continue;
        }
        const asset_id = variable.type.Kind;
        if (!asset_id || !isUUID(asset_id)) {
          continue;
        }
        asset_ids.push(asset_id);
      }
      this.$getAppManager()
        .get(CreatorAssetManager)
        .requestAssetShortInCacheList(asset_ids);
    },
  },
});
</script>
<style lang="scss" rel="stylesheet/scss" scoped>
@use '~ims-app-base/style/Form';

.VariableList-list {
  margin-bottom: 20px;
}
.VariableList-empty {
  margin-bottom: 20px;
}
</style>
