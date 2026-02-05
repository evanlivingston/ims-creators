<template>
  <div class="LevelEditorToolbar">
    <div
      v-for="group of groupedTools"
      :key="group.section"
      class="LevelEditorToolbar-section"
    >
      <async-component
        :is="tool.component"
        v-for="tool of group.tools"
        :key="tool.name"
      >
        <template #default="{ component }">
          <component
            :is="component"
            :tool="tool"
            :tool-manager="toolManager"
            v-bind="tool.componentProps"
          ></component>
        </template>
      </async-component>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType, type UnwrapRef } from 'vue';
import AsyncComponent from '~ims-app-base/components/Common/AsyncComponent.vue';
import type LevelEditorCanvasController from '../LevelEditorCanvasController';
import type { ToolSection } from './ToolManager';
import type Tool from './tools/base/Tool';

type GroupedToolSection = {
  section: ToolSection;
  tools: Tool[];
};

export default defineComponent({
  name: 'LevelEditorToolbar',
  components: {
    AsyncComponent,
  },
  props: {
    controller: {
      type: Object as PropType<UnwrapRef<LevelEditorCanvasController>>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    toolManager() {
      return this.controller.toolManager;
    },
    tools() {
      return this.toolManager.getTools();
    },
    groupedTools(): GroupedToolSection[] {
      const groups = new Map<ToolSection, GroupedToolSection>();
      const list: GroupedToolSection[] = [];
      for (const tool of this.tools) {
        if (this.readonly && !tool.readonly) {
          continue;
        }
        if (tool.isDisabled() && tool.hideWhenDisabled) {
          continue;
        }
        let group = groups.get(tool.section);
        if (!group) {
          group = {
            section: tool.section,
            tools: [],
          };
          list.push(group);
          groups.set(tool.section, group);
        }
        group.tools.push(tool);
      }
      return list;
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';

.LevelEditorToolbar-section {
  @include ImcEditorToolbar.ImcEditorToolbar-section;
}

.LevelEditorToolbar {
  display: inline-flex;
  @include ImcEditorToolbar.ImcEditorToolbar-toolbar;

  &:deep(.is-button-toolbar) {
    @include ImcEditorToolbar.ImcEditorToolbar-button;
  }
}
</style>
