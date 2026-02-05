<template>
  <menu-button class="LevelEditorToolbarDropdownButton">
    <template #button="{ toggle }">
      <level-editor-toolbar-button-base
        :tool="tool"
        :tool-manager="toolManager"
        @click="toggle"
      ></level-editor-toolbar-button-base>
    </template>
    <menu-list :menu-list="menuList"></menu-list>
  </menu-button>
</template>
<script lang="ts">
import { defineComponent, type PropType, type UnwrapRef } from 'vue';
import MenuButton from '~ims-app-base/components/Common/MenuButton.vue';
import MenuList from '~ims-app-base/components/Common/MenuList.vue';
import type Tool from './tools/base/Tool';
import type { MenuListItem } from '~ims-app-base/logic/types/MenuList';
import LevelEditorToolbarButtonBase from './LevelEditorToolbarButtonBase.vue';
import type ToolManager from './ToolManager';

export default defineComponent({
  name: 'LevelEditorToolbarDropdownButton',
  components: {
    MenuButton,
    MenuList,
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
    menuList: {
      type: Array as PropType<MenuListItem[]>,
      default: null,
    },
  },
});
</script>
<style lang="scss" scoped>
.LevelEditorToolbarDropdownButton {
  display: inline-flex;
}
</style>
