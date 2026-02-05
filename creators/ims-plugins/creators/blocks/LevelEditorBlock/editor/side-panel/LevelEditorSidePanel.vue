<template>
  <div class="LevelEditorSidePanel">
    <slot name="header">
      <div class="LevelEditorSidePanel-header">
        {{ header }}
      </div>
    </slot>
    <div class="LevelEditorSidePanel-content tiny-scrollbars">
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LevelEditorSidePanel',
  props: {
    header: {
      type: String,
      default: null,
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/components/ImcText/Toolbar/ImcEditorToolbar.scss';
@use './LevelEditorSidePanel';

.LevelEditorSidePanel {
  display: flex;
  flex-direction: column;
  width: 260px;
  padding: 10px;
  cursor: default;

  @include ImcEditorToolbar.ImcEditorToolbar-dropdown;
}
.LevelEditorSidePanel-header {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 15px;
}
.LevelEditorSidePanel-content {
  height: 100%;
  overflow: auto;
}
</style>
