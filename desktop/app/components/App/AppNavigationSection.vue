<template>
  <width-resizer
    v-model:content-width="sectionWidth"
    :min-width="minWidth"
    :initial-width="initialWidth"
    :resize-side="'right'"
    class="AppNavigationSection"
    :style="menuStyle"
    :class="{ active: isActive }"
  >
    <div class="AppNavigationSection-options">
      <slot name="button"></slot>
      <project-options-dropdown
        v-if="activeTab?.name === 'project-gdd'"
        class="AppNavigationSection-options-menu"
      ></project-options-dropdown>
    </div>
    <component
      :is="activeTab.component"
      v-if="activeTab"
      :key="activeTab.name"
      :props="activeTab.props"
    ></component>
  </width-resizer>
</template>
<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import WidthResizer from '~ims-app-base/components/Common/WidthResizer.vue';
import ProjectOptionsDropdown from './ProjectOptionsDropdown.vue';
import { APP_NAVIGATION_SECTION_MIN_WIDTH, APP_NAVIGATION_SECTION_INITIAL_WIDTH } from '~ims-app-base/components/layoutConstants';
import type { ProjectMenuItem } from '~ims-app-base/logic/configurations/base-app-configuration';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';
import type { ProjectFullInfo } from '~ims-app-base/logic/types/ProjectTypes';

export default defineComponent({
  name: 'AppNavigationSection',
  components: {
    WidthResizer,
    ProjectOptionsDropdown,
  },
  props: {
    activeTab: {
      type: [Object, null] as PropType<ProjectMenuItem | null>,
      default: null,
    },
    projectInfo: {
      type: [Object, null] as PropType<ProjectFullInfo | null>,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isCaptured: false,
      minWidth: APP_NAVIGATION_SECTION_MIN_WIDTH,
      initialWidth: APP_NAVIGATION_SECTION_INITIAL_WIDTH,
    };
  },
  computed: {
    menuStyle() {
      return {
        '--AppNavigationSection-width': `${this.sectionWidth}px`,
      };
    },
    sectionWidth: {
      get(): number {
        return this.$getAppManager()
          .get(UiPreferenceManager)
          .getPreference('AppMenu.sectionWidth', this.initialWidth);
      },
      set(val: number) {
        this.$getAppManager()
          .get(UiPreferenceManager)
          .setPreference('AppMenu.sectionWidth', val);
      },
    },
  },
});
</script>
<style lang="scss" scoped>
@use '~ims-app-base/style/devices-mixins.scss';
:deep(.BlockWithMenu-menu) {
  margin-right: 3px;
}
.AppNavigationSection {
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  gap: 10px;
  background-color: var(--app-menu-bg-color);
  --local-bg-color: var(--app-menu-bg-color);
  z-index: 1;
  width: var(--AppNavigationSection-width);
  // transition: margin-left 0.2s;
  margin-left: calc(0px - var(--AppNavigationSection-width));
  // transition: transform 0.2s;
  // transform: translate(calc(0px - var(--AppNavigationSection-width)), 0);
  // pointer-events: auto;

  @include devices-mixins.device-type(not-pc) {
    width: 100% !important;
    margin-left: 0;
    height: auto;
    flex: 1;
  }

  &.active {
    // transform: translate(0);
    margin-left: 0;
  }

  :deep(.ProjectSelectGames-option button),
  :deep(.ProjectLayout-Header-ProjectSelect-item) {
    font-size: var(--local-font-size) !important;
  }
  :deep(.ProjectSelectGames-license) {
    font-size: 8px;
  }
  :deep(.ProjectSelectGames-select) {
    max-width: none;
  }
  :deep(.ProjectSelectGames-select__drop) {
    width: 100%;

    @include devices-mixins.device-type(not-pc) {
      margin-left: 0;
    }
  }
  :deep(.ProjectSelectGames-licenseContainer__up-arrow),
  :deep(.ProjectSelectGames-licenseContainer__drop-arrow) {
    font-size: 18px;
  }
  :deep(.ProjectSelectGames-option) {
    padding: 0.3em 1em;
  }
  :deep(.GameDesignMenu-Search) {
    flex: 1;
  }
}
.AppNavigationSection-options {
  display: flex;
  gap: 5px;
  width: 100%;
}
.AppNavigationSection-options-menu {
  flex-shrink: 0;
}
.AppNavigationSection-projectSelect {
  width: 100%;
  flex-shrink: 1;
}
</style>
