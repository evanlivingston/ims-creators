<template>
  <button class="button AppMenuToggle" @click="$emit('click')">
    <i
      :class="{
        'ri-menu-fold-line': projectMenuController.isMobileMenuOpened.value,
        'ri-menu-unfold-line': !projectMenuController.isMobileMenuOpened.value,
      }"
    ></i>
  </button>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { useProjectMenu } from '~ims-app-base/components/useProjectMenu';


export default defineComponent({
  name: 'AppMenuToggle',
  emits: ['click'],
  setup() {
    const projectMenuController = useProjectMenu();
    return {
      projectMenuController,
    };
  },
});
</script>
<style lang="scss" scoped>
.AppMenuToggle {
  color: var(--local-text-color);
  font-size: 25px;
  padding: 0px;
  background-color: transparent;
  text-shadow: none;
}
</style>
