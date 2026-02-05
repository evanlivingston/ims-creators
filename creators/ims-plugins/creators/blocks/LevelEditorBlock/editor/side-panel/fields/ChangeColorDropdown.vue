<template>
  <menu-button class="ChangeColorDropdown">
    <template #button="{ toggle }">
      <button
        class="is-button is-button-text ChangeColorDropdown-button"
        :disabled="readonly"
        @click="toggle"
      >
        <div class="ChangeColorDropdown-button-label">
          {{ $t('levelEditor.properties.fields.' + (editProp ?? 'color')) }}
        </div>
        <div
          class="ChangeColorDropdown-button-value"
          :style="buttonStyle"
        ></div>
        <div
          v-if="modelValue === 'Mixed'"
          class="ChangeColorDropdown-button-value mixed"
        >
          Mixed
        </div>
      </button>
    </template>
    <div class="ChangeColorDropdown-menu">
      <button
        v-for="color of uniqColors"
        :key="color.fill"
        class="ChangeColorDropdown-menu-color"
        :style="{
          '--ChangeColorDropdown-fill':
            editProp === 'stroke' ? color.stroke : color.fill,
          '--ChangeColorDropdown-stroke':
            editProp === null ? color.stroke : 'transparent',
        }"
        @click="changeColor(color)"
      ></button>
    </div>
  </menu-button>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import type { ColorSet } from '../../shapes/shapePropertyDescriptors';

export default defineComponent({
  name: 'ChangeColorButton',
  components: {
    MenuButton,
  },
  props: {
    modelValue: {
      type: [Object, String] as PropType<ColorSet | 'Mixed'>,
      default: null,
    },
    colors: {
      type: Array as PropType<ColorSet[]>,
      required: true,
    },
    editProp: {
      type: String as PropType<keyof ColorSet>,
      default: null,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:model-value'],
  computed: {
    uniqColors() {
      if (this.editProp === 'stroke') {
        const used = new Set<string>();
        const res: ColorSet[] = [];
        for (const color of this.colors) {
          if (used.has(color.stroke)) {
            continue;
          }
          res.push(color);
          used.add(color.stroke);
        }
        return res;
      } else return this.colors;
    },
    buttonStyle() {
      if (!this.modelValue || this.modelValue === 'Mixed') {
        return {};
      }
      const colorSet = this.modelValue;
      if (this.editProp === 'fill') {
        return {
          '--ChangeColorDropdown-fill': colorSet.fill,
          '--ChangeColorDropdown-stroke': 'transparent',
        };
      } else if (this.editProp === 'stroke') {
        return {
          '--ChangeColorDropdown-fill': colorSet.stroke,
          '--ChangeColorDropdown-stroke': 'transparent',
        };
      } else {
        return {
          '--ChangeColorDropdown-fill': colorSet.fill,
          '--ChangeColorDropdown-stroke': colorSet.stroke,
        };
      }
    },
  },
  methods: {
    changeColor(color: { fill: string; stroke: string }) {
      this.$emit('update:model-value', color);
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';
@use '../LevelEditorSidePanel.scss';

.ChangeColorDropdown {
  width: 100%;
}

.ChangeColorDropdown-button.is-button {
  --button-padding: 5px 5px;
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.ChangeColorDropdown-button-label {
  @include LevelEditorSidePanel.LevelEditorSidePanel-property;
}
.ChangeColorDropdown-button-value {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: var(--ChangeColorDropdown-fill, transparent);
  border: 1px solid var(--ChangeColorDropdown-stroke, transparent);

  &.mixed {
    width: auto;
    height: auto;
    font-size: 10px;
  }
}

.ChangeColorDropdown-menu {
  @include ImcEditorToolbar.ImcEditorToolbar-dropdown;
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(7, 1fr);
  padding: 3px;
  box-shadow: 0px 0px 4px 0px #00000040;

  &:deep(.is-button-toolbar) {
    @include ImcEditorToolbar.ImcEditorToolbar-button;
  }
}
.ChangeColorDropdown-menu-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background-color: var(--ChangeColorDropdown-fill, transparent);
  border: 1px solid var(--ChangeColorDropdown-stroke, transparent);
  padding: 0;
  color: var(--local-text-color);
  line-height: 16px;
  & > i.ri-close-fill {
    opacity: 0.5;
  }
  &:hover {
    outline: 1px solid var(--ChangeColorDropdown-color, transparent);
    & > i.ri-close-fill {
      opacity: 1;
    }
  }
}
</style>
