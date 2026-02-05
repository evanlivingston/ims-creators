<template>
  <div class="ValueField">
    <div class="ValueField-value">
      <div v-if="modelValueAssetProp" class="is-input ValueField-value-asset">
        <asset-link-prop-presenter
          class="ValueField-value-asset-presenter"
          :model-value="modelValueAssetProp"
        ></asset-link-prop-presenter>
        <button
          v-if="!readonly"
          class="is-button is-button-icon-small ValueField-value-asset-clear"
          @click="clearValue()"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <ims-input
        v-else
        :model-value="modelValueStringProp ?? ''"
        :type="'textarea'"
        :disabled="readonly"
        @update:model-value="ownModelValue = $event"
      ></ims-input>
    </div>
    <menu-button
      v-if="!readonly"
      v-model:shown="dropdownShown"
      class="ValueField-button"
    >
      <template #button="{ toggle }">
        <button class="is-button is-button-icon-outlined" @click="toggle">
          <i class="ri-file-search-line"></i>
        </button>
      </template>
      <select-asset-list-box
        :where="where"
        :model-value="null"
        class="is-dropdown ValueField-button-dropdown"
        @update:model-value="selectAsset($event)"
      ></select-asset-list-box>
    </menu-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import ImsInput from '~ims-app-base/components/Common/ImsInput.vue';
import type { LevelEditorShape } from '../../LevelEditor';
import AssetLinkPropPresenter from '~ims-app-base/components/Props/AssetLinkPropPresenter.vue';
import type { AssetPropValueAsset } from '~ims-app-base/logic/types/Props';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import SelectAssetListBox from '~ims-app-base/components/Asset/SelectAssetListBox.vue';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { AssetForSelection } from '~ims-app-base/logic/types/AssetsType';

export default defineComponent({
  name: 'ValueField',
  components: {
    AssetLinkPropPresenter,
    ImsInput,
    SelectAssetListBox,
    MenuButton,
  },
  props: {
    modelValue: {
      type: [Object, String] as PropType<LevelEditorShape['value']>,
      default: null,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:model-value'],
  data() {
    return {
      dropdownShown: false,
    };
  },
  computed: {
    modelValueAssetProp(): AssetPropValueAsset | null {
      if (this.modelValue && (this.modelValue as AssetPropValueAsset).AssetId) {
        return this.modelValue as AssetPropValueAsset;
      } else return null;
    },
    modelValueStringProp() {
      if (typeof this.modelValue === 'string') {
        return this.modelValue as string;
      } else return null;
    },
    ownModelValue: {
      get() {
        return this.modelValue;
      },
      set(new_val: LevelEditorShape['value']) {
        this.$emit('update:model-value', new_val);
      },
    },
    where() {
      const gdd_id = this.$getAppManager()
        .get(ProjectManager)
        .getWorkspaceIdByName('gdd');
      return {
        workspaceids: gdd_id,
      };
    },
  },
  methods: {
    clearValue() {
      this.ownModelValue = null;
    },
    selectAsset(asset: AssetForSelection | null | undefined) {
      this.dropdownShown = false;
      if (!asset) return;
      this.ownModelValue = {
        AssetId: asset.id,
        Name: asset.name,
        Title: asset.title ?? '',
      };
    },
  },
});
</script>
<style lang="scss" scoped>
.ValueField {
  display: flex;
  align-items: flex-start;
  gap: 5px;
}
.ValueField-value {
  flex: 1;
}
.ValueField-value-asset {
  display: flex;
  justify-content: space-between;
  align-items: center;

  --input-border-hl-color: var(--input-border-color);

  .ValueField-value-asset-presenter {
    padding: 0;
  }
  .ValueField-value-asset-clear {
  }
}
.ValueField-button {
  display: flex;
  gap: 5px;
}
.ValueField-button-dropdown {
  padding: var(--dropdown-padding);
  min-width: var(--DropdownContainer-attachToElement-width);
  --SelectAssetListBox-itemsHeight: 250px;
}
</style>
