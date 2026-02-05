<template>
  <div class="AppMenu" :class="{ hidden: !mobileMenuState }">
    <app-navigation-section
      class="AppMenu-section"
      :is-active="
        !!sectionState &&
        activeTab &&
        (activeTab.hasAdditionalMenu === undefined ||
          activeTab.hasAdditionalMenu)
      "
      :project-info="projectInfo ?? null"
      :active-tab="activeTab ?? null"
      :user-info="userInfo ?? null"
    >
      <template #button>
        <project-dropdown-menu
          :projects="recentProjectList"
          :current-project="localProjectInfo"
        ></project-dropdown-menu>
      </template>
    </app-navigation-section>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppNavigationSection from './AppNavigationSection.vue';
import AuthManager from '~ims-app-base/logic/managers/AuthManager';
import type { ProjectMenuItem } from '~ims-app-base/logic/configurations/base-app-configuration';
import ProjectManager from '~ims-app-base/logic/managers/ProjectManager';
import type { ProjectFullInfo } from '~ims-app-base/logic/types/ProjectTypes';
import UiManager, { ScreenSize } from '~ims-app-base/logic/managers/UiManager';
import ProjectDropdownMenu from './ProjectDropdownMenu.vue';
import DesktopCreatorManager from '#logic/managers/DesktopCreatorManager';
import type { AuthTokenInfo } from '~ims-app-base/logic/managers/ApiWorker';
import type { LocalProjectInitInfo } from '#bridge/api/ImsHostProject';

export default defineComponent({
  name: 'AppMenu',
  components: {
    AppNavigationSection,
    ProjectDropdownMenu,
  },
  props: {
    sectionState: {
      type: Boolean,
      default: false,
    },
    mobileMenuState: {
      type: Boolean,
      default: false,
    },
    initialSectionName: {
      type: String,
      default: 'project-gdd',
    },
  },
  emits: ['update:sectionState', 'update:mobileMenuState'],
  data() {
    return {
      activeTabName: (this.initialSectionName
        ? this.initialSectionName
        : null) as string | null,
    };
  },
  computed: {
    recentProjectList(){
      return this.$getAppManager().get(DesktopCreatorManager).getRecentProjectList();
    },
    userInfo(): AuthTokenInfo | undefined {
      return this.$getAppManager().get(AuthManager).getUserInfo();
    },
    extendedProjectMenu(): ProjectMenuItem[] {
      return [...this.projectMenu];
    },
    projectMenu(): ProjectMenuItem[] {
      const projectMenu = this.$appConfiguration.getProjectMenu(
        this.$getAppManager(),
      );
      return projectMenu;
    },
    activeTab(): ProjectMenuItem | undefined {
      if (!this.sectionState) {
        return;
      }
      return this.extendedProjectMenu.find(
        (item: ProjectMenuItem) => item.name === this.activeTabName,
      );
    },
    isGuest() {
      return !this.$getAppManager().get(ProjectManager).getUserRoleInProject();
    },
    projectInfo(): ProjectFullInfo | null {
      return this.$getAppManager().get(ProjectManager).getProjectInfo();
    },
    localProjectInfo(): LocalProjectInitInfo | null {
      return {
        id: this.projectInfo?.id ?? null,
        title: this.projectInfo?.title ?? '',
        localPath: this.projectInfo?.localPath ?? '',
      }
    },
    isMobile() {
      return this.$getAppManager()
        .get(UiManager)
        .isScreenSize(ScreenSize.NOT_PC);
    },
    routeFullPath() {
      return this.$route.fullPath;
    },
  },
  watch: {
    routeFullPath() {
      if (this.isMobile) {
        this.$emit('update:mobileMenuState', false);
      }
    },
  },
  methods: {
    selectTab(item: ProjectMenuItem) {
      if (
        this.activeTabName &&
        this.activeTabName === item.name &&
        !this.isMobile &&
        this.sectionState
      ) {
        this.activeTabName = null;
        this.$emit('update:sectionState', false);
      } else {
        this.activeTabName = item.name;
        if (!this.sectionState) {
          this.$emit('update:sectionState', true);
        }
      }
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/style/devices-mixins.scss';

.AppMenu {
  z-index: 300;
  display: flex;
  overflow: hidden;
  height: 100%;
  box-shadow: 0px 2px 2px 0px #00000026;

  @include devices-mixins.device-type(not-pc) {
    position: absolute;
    width: 100%;
    flex-direction: column;
    padding: 60px 0 0;
    background-color: var(--default-bg-primary);
    transition: transform 0.2s;

    &.hidden {
      display: flex !important;
      transform: translateX(-100%);
    }
  }

  @include devices-mixins.device-type(pc) {
    &.hidden {
      display: flex !important;
    }
  }
}
.AppMenu-section {
  @include devices-mixins.device-type(not-pc) {
    overflow: auto;
  }
}
</style>
