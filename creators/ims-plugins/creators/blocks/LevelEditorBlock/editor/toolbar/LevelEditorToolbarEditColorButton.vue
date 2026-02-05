<template>
  <div class="LevelEditorToolbarEditColorButton">
    <div class="LevelEditorToolbarEditColorButton-title">
      {{ $t('levelEditor.tools.' + tool.name) }}:
    </div>
    <menu-button class="LevelEditorToolbarDropdownButton">
      <template #button="{ toggle }">
        <level-editor-toolbar-button-base
          :tool="tool"
          :tool-manager="toolManager"
          @click="toggle"
        >
          <div
            class="LevelEditorToolbarDropdownButton-current-color"
            :style="buttonStyle"
          ></div>
        </level-editor-toolbar-button-base>
      </template>
      <div class="LevelEditorToolbarEditColorButton-dropdown">
        <button
          v-for="color of uniqColors"
          :key="color.fill"
          class="LevelEditorToolbarEditColorButton-color"
          :style="{
            '--LevelEditorToolbarEditColorButton-fill':
              editProp === 'stroke' ? color.stroke : color.fill,
            '--LevelEditorToolbarEditColorButton-stroke':
              editProp === null ? color.stroke : 'transparent',
          }"
          @click="changeColor(color)"
        ></button>
      </div>
    </menu-button>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType, type UnwrapRef } from 'vue';
import type Tool from './tools/base/Tool';
import type ToolManager from './ToolManager';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import LevelEditorToolbarButtonBase from './LevelEditorToolbarButtonBase.vue';
import type { ColorSet } from './tools/base/EditShapeColorTool';

export default defineComponent({
  name: 'LevelEditorToolbarEditColorButton',
  components: {
    MenuButton,
    LevelEditorToolbarButtonBase,
  },
  props: {
    tool: {
      type: Object as PropType<Tool>,
      required: true,
    },
    toolManager: {
      type: Object as PropType<UnwrapRef<ToolManager>>,
      required: true,
    },
    colors: { type: Array<ColorSet>, required: true },
    editProp: {
      type: String as PropType<keyof ColorSet>,
      default: null,
    },
    getCurrentColorSet: {
      type: Function as PropType<() => ColorSet>,
      default: null,
    },
    onColorChange: {
      type: Function,
      default: null,
    },
  },
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
      if (!this.getCurrentColorSet || !this.getCurrentColorSet()) {
        return {};
      }
      const colorSet = this.getCurrentColorSet();
      if (this.editProp === 'fill') {
        return {
          '--LevelEditorToolbarDropdownButton-fill': colorSet.fill,
          '--LevelEditorToolbarDropdownButton-stroke': 'transparent',
        };
      } else if (this.editProp === 'stroke') {
        return {
          '--LevelEditorToolbarDropdownButton-fill': colorSet.stroke,
          '--LevelEditorToolbarDropdownButton-stroke': 'transparent',
        };
      } else {
        return {
          '--LevelEditorToolbarDropdownButton-fill': colorSet.fill,
          '--LevelEditorToolbarDropdownButton-stroke': colorSet.stroke,
        };
      }
    },
  },
  methods: {
    changeColor(color: { fill: string; stroke: string }) {
      if (!this.onColorChange) return;
      this.onColorChange(color);
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';

.LevelEditorToolbarEditColorButton {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0px 5px;
}
.LevelEditorToolbarEditColorButton-title {
  font-size: 12px;
  color: var(--local-sub-text-color);
}
.LevelEditorToolbarDropdownButton-current-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: var(--LevelEditorToolbarDropdownButton-fill, transparent);
  border: 1px solid var(--LevelEditorToolbarDropdownButton-stroke, transparent);
}

.LevelEditorToolbarEditColorButton-dropdown {
  @include ImcEditorToolbar.ImcEditorToolbar-dropdown;
  display: grid;
  gap: 3px;
  grid-template-columns: repeat(7, 1fr);
  padding: 3px;

  &:deep(.is-button-toolbar) {
    @include ImcEditorToolbar.ImcEditorToolbar-button;
  }
}
.LevelEditorToolbarEditColorButton-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background-color: var(--LevelEditorToolbarEditColorButton-fill, transparent);
  border: 1px solid var(--LevelEditorToolbarEditColorButton-stroke, transparent);
  padding: 0;
  color: var(--local-text-color);
  line-height: 16px;
  & > i.ri-close-fill {
    opacity: 0.5;
  }
  &:hover {
    outline: 1px solid
      var(--LevelEditorToolbarEditColorButton-color, transparent);
    & > i.ri-close-fill {
      opacity: 1;
    }
  }
}
</style>
