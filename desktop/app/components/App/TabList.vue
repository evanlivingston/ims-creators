<template>
  <div class="TabList tiny-scrollbars">
    <template v-for="tab of list" :key="tab.title">
      <div
        class="TabList-one"
        :class="{
          'state-current': currentTab === tab,
        }"
        @click="openTab(tab)"
      >
        <div class="TabList-one-content">{{ tab.title }}</div>
        <button
          class="is-button is-button-icon"
          @click.stop="removeFromList(tab)"
        >
          <i class="ri-close-fill"></i>
        </button>
      </div>
      <div class="TabList-sep"></div>
    </template>
    <div class="TabList-space">
      <button class="is-button is-button-icon" @click="openNewTab">
        <i class="ri-add-fill"></i>
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { DesktopTab } from '#logic/types/DesktopTabController';

export default defineComponent({
  name: 'TabList',
  props: {
    list: {
      type: Array as PropType<DesktopTab[]>,
      default: () => [],
    },
    currentTab: {
      type: Object as PropType<DesktopTab>,
      default: null,
    },
  },
  emits: ['open', 'create', 'remove'],
  methods: {
    openTab(tab: DesktopTab) {
      this.$emit('open', tab);
    },
    openNewTab() {
      this.$emit('create', null);
    },
    removeFromList(tab: DesktopTab) {
      this.$emit('remove', tab);
    },
  },
});
</script>
<style lang="scss" scoped>
.TabList {
  display: flex;
  padding-top: 10px;
  overflow-y: auto;
}
.TabList-space {
  flex: 1;
  padding: 5px 0;
}
.TabList-one {
  cursor: pointer;
  min-width: 200px;
  padding: 5px 10px;
  border-radius: 8px;
  margin-bottom: 5px;
  transition: 0.2s ease-in-out;
  display: flex;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  & > .is-button {
    display: none;
  }
  &:first-child {
    margin-left: 10px;
  }
  &.state-current {
    background: var(--local-box-color);
    padding-bottom: 10px;
    margin-bottom: 0;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
  &:not(.state-current):hover {
    background: var(--local-box-color);
    cursor: pointer;
  }
  &.state-current,
  &:hover {
    & > .is-button {
      display: block;
    }
  }
}
.TabList-one-content {
  flex: 1;
}
.TabList-sep {
  border-right: 1px solid var(--local-border-color);
  margin: 10px 5px;
}
</style>
