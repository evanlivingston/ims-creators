<template>
  <div class="WebLayout">
    <div class="WebLayout-sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
      <template v-if="!sidebarCollapsed">
        <GameDesignMenu
          v-if="gddVM"
          :gdd-v-m="gddVM"
        />
        <div v-else class="WebLayout-sidebar-loading">Loading tree...</div>
      </template>
      <button
        class="WebLayout-sidebar-toggle"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggleSidebar"
      >
        <i :class="sidebarCollapsed ? 'ri-layout-right-2-line' : 'ri-layout-left-2-line'" />
      </button>
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
      providedMenuWidth: computed(() => this.sidebarCollapsed ? 0 : 280),
    };
  },
  data() {
    return {
      gddVM: null as GameDesignMenuVM | null,
      sidebarCollapsed: typeof localStorage !== 'undefined'
        ? localStorage.getItem('sidebar-collapsed') === 'true'
        : false,
    };
  },
  computed: {
    projectId() {
      return this.$getAppManager().get(ProjectManager).getProjectInfo()?.id;
    },
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebar-collapsed', String(this.sidebarCollapsed));
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
  transition: width 0.2s ease, min-width 0.2s ease;
  position: relative;

  &.is-collapsed {
    width: 32px;
    min-width: 32px;
  }

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

.WebLayout-sidebar-toggle {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }
}

.WebLayout-sidebar-loading {
  padding: 16px;
  color: #888;
  font-size: 13px;
  flex: 1;
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
