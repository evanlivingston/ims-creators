<template>
  <level-editor-toolbar-button-base
    :tool="tool"
    :tool-manager="toolManager"
    class="LevelEditorToolbarButton"
    @click="triggerTool"
  ></level-editor-toolbar-button-base>
</template>
<script lang="ts">
import { defineComponent, type PropType, type UnwrapRef } from 'vue';
import type Tool from './tools/base/Tool';
import type ToolManager from './ToolManager';
import LevelEditorToolbarButtonBase from './LevelEditorToolbarButtonBase.vue';

export default defineComponent({
  name: 'LevelEditorToolbarButton',
  components: {
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
  },
  computed: {
    isActive() {
      return this.toolManager.isToolActive(this.tool);
    },
  },
  methods: {
    async triggerTool() {
      await this.toolManager.triggerTool(this.tool.name);
    },
  },
});
</script>
