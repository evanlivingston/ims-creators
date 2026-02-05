<template>
  <div class="LevelEditorAssetShapeCreate">
    <button
      v-for="option in options"
      :key="option.name"
      :ref="(el) => setButtonRef(option.name, el as HTMLElement)"
      class="is-button is-button-value-switcher"
      @click="select(option.name)"
    >
      <i
        v-if="option.icon"
        :class="[option.icon]"
        class="LevelEditorAssetShapeCreate-switcher-option-icon"
      ></i>
      <span class="LevelEditorAssetShapeCreate-switcher-option-title">
        {{ $t('levelEditor.tools.' + option.name) }}
      </span>
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { getShapeControllers } from './shapes/controllers';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';

const AVAILABLE_SHAPE_TYPES = ['pointer', 'rect', 'ellipse'];

export default defineComponent({
  name: 'LevelEditorAssetShapeType',
  props: {
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select'],
  data() {
    return {
      buttonRefs: new Map<string, HTMLElement>(),
    };
  },
  computed: {
    shapeControllers() {
      return getShapeControllers(this.$getAppManager());
    },
    options() {
      const options: { name: string; icon: string | null }[] = [];
      for (const shape_type of AVAILABLE_SHAPE_TYPES) {
        const shape_controller = this.shapeControllers.map[shape_type];
        if (shape_controller) {
          options.push({
            name: shape_controller.name,
            icon: shape_controller.icon,
          });
        }
      }
      return options;
    },
    defaultShapeType: {
      get(): string {
        return this.$getAppManager()
          .get(UiPreferenceManager)
          .getPreference('LevelEditor.assetShapeType', 'pointer');
      },
      set(val: string) {
        this.$getAppManager()
          .get(UiPreferenceManager)
          .setPreference('LevelEditor.assetShapeType', val);
      },
    },
  },
  mounted() {
    const current_button = this.buttonRefs.get(this.defaultShapeType);
    current_button?.focus();
  },
  methods: {
    setButtonRef(option_name: string, button_element: HTMLElement) {
      if (!button_element) this.buttonRefs.delete(option_name);
      else {
        this.buttonRefs.set(option_name, button_element);
      }
    },
    select(option_name: string) {
      this.defaultShapeType = option_name;
      this.$emit('select', option_name);
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';
.LevelEditorAssetShapeCreate {
  display: flex;
  flex-direction: column;
  gap: 5px;
  @include ImcEditorToolbar.ImcEditorToolbar-toolbar;
  padding: 5px;
}
.LevelEditorAssetShapeCreate-switcher {
  flex-direction: column;
  --ValueSwitcher-border-radius: 4px !important;

  :deep(.ref-item) {
    justify-content: flex-start;

    &:first-child {
      border-radius: 4px 4px 0px 0px !important;
    }
    &:not(:first-child):not(:last-child) {
      border-radius: 0px !important;
    }
    &:last-child {
      border-radius: 0px 0px 4px 4px !important;
    }
  }
}
.LevelEditorAssetShapeCreate-switcher-option {
  display: inline-flex;
  gap: 5px;
}
.LevelEditorAssetShapeCreate-button {
  justify-content: center;
}
</style>
