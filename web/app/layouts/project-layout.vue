<template>
  <div class="WebLayout">
    <div class="WebLayout-sidebar">
      <GameDesignMenu
        v-if="gddVM"
        :gdd-v-m="gddVM"
      />
      <div v-else class="WebLayout-sidebar-loading">Loading tree...</div>
    </div>
    <div class="WebLayout-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from 'vue';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import CreatorAssetManager from '~ims-app-base/logic/managers/CreatorAssetManager';
import GameDesignMenu from '~ims-app-base/components/GameDesign/GameDesignMenu.vue';
import { GameDesignMenuVM } from '~ims-app-base/logic/vm/GameDesignMenuVM';

export default defineComponent({
  name: 'ProjectLayout',
  components: {
    GameDesignMenu,
  },
  provide() {
    return {
      providedMenuWidth: computed(() => 280),
    };
  },
  data() {
    return {
      gddVM: null as GameDesignMenuVM | null,
    };
  },
  computed: {
    projectId() {
      return this.$getAppManager().get(ProjectManager).getProjectInfo()?.id;
    },
  },
  async mounted() {
    try {
      const rootWorkspace = await this.$getAppManager()
        .get(CreatorAssetManager)
        .getWorkspaceByNameViaCache('gdd');
      if (rootWorkspace) {
        const vm = reactive(new GameDesignMenuVM(this.$getAppManager(), rootWorkspace.id));
        vm.init();
        this.gddVM = vm as GameDesignMenuVM;
      }
    } catch (err) {
      console.error('Failed to load project tree:', err);
    }
  },
});
</script>

<style lang="scss">
.WebLayout {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.WebLayout-sidebar {
  width: 280px;
  min-width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--app-menu-bg-color, #1a1a2e);

  .GameDesignMenu {
    min-width: unset !important;
    max-width: unset !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    padding: 10px 8px !important;
  }
}

.WebLayout-sidebar-loading {
  padding: 16px;
  color: #888;
  font-size: 13px;
}

.WebLayout-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: auto;
  background-color: var(--editor-bg-color);
  --local-bg-color: var(--editor-bg-color);
  --local-box-color: var(--editor-box-color);
}
</style>
