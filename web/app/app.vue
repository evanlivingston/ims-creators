<template>
  <div class="WebApp" ref="el">
    <NuxtLoadingIndicator
      color="var(--color-accent)"
      error-color="var(--color-danger)"
    ></NuxtLoadingIndicator>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <DialogHost :dialogs="openedDialogs"></DialogHost>
    <div class="App-proTooltip"><i class="ri-arrow-up-double-fill"></i></div>
    <div class="App-toasts">
      <AppToasts></AppToasts>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppManager, useHead, useLocaleHead } from '#imports';
import {
  computed,
  onMounted,
  onUnmounted,
  provide,
  useTemplateRef,
  watch,
  ref,
} from 'vue';
import DialogHost from '~ims-app-base/components/Dialog/DialogHost.vue';
import DialogManager from '~ims-app-base/logic/managers/DialogManager';
import LocalFsSyncManager from '~ims-app-base/logic/managers/LocalFsSyncManager';
import UiManager from '~ims-app-base/logic/managers/UiManager';
import UiPreferenceManager from '~ims-app-base/logic/managers/UiPreferenceManager';
import AppToasts from '~ims-app-base/components/Common/AppToasts.vue';

const appManager = useAppManager();

const i18nHead = useLocaleHead();

const openedDialogs = computed(() => {
  return appManager.get(DialogManager)?.dialogs ?? [];
});

const themeType = ref(appManager.get(UiManager).getColorTheme());
watch(
  () => {
    return appManager.get(UiManager).getColorTheme();
  },
  (val) => {
    themeType.value = val;
    if (typeof window !== 'undefined' && window.document) {
      window.document.body.dataset['theme'] = val;
    }
  },
);

useHead(() => ({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang,
    link: [...(i18nHead.value.link || [])],
    meta: [...(i18nHead.value.meta || [])],
  },
  bodyAttrs: {
    'data-theme': themeType.value,
  },
}));

function handleResize() {
  appManager.get(UiManager).handleResize(window.innerWidth);
}
onMounted(async () => {
  await appManager.get(UiPreferenceManager).initClient();
  await appManager.get(UiManager).initClient();
  await appManager.get(LocalFsSyncManager).initClient();
  window.addEventListener('resize', handleResize, {
    passive: true,
  });
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const el = useTemplateRef('el');
let rightPanelDiv: HTMLDivElement | null = null;
provide('getRightPanel', () => {
  if (!el.value) return null;
  if (!rightPanelDiv) {
    rightPanelDiv = document.createElement('DIV') as HTMLDivElement;
    rightPanelDiv.className = 'right-panel';
    el.value.appendChild(rightPanelDiv);
  }
  return rightPanelDiv;
});

let dropdownHostDiv: HTMLDivElement | null = null;
provide('getDropdownHost', () => {
  if (!el.value) return null;
  if (!dropdownHostDiv) {
    dropdownHostDiv = document.createElement('DIV') as HTMLDivElement;
    dropdownHostDiv.className = 'dropdown-host';
    el.value.appendChild(dropdownHostDiv);
  }
  return dropdownHostDiv;
});
</script>

<style lang="scss">
@use '~ims-app-base/style/vue-select';
@use '~ims-app-base/style/new-vars.scss';
@use '~ims-app-base/style/app';
@use '~ims-app-base/style/load-page';
@import '~ims-app-base/style/fonts/Ubuntu/stylesheet.css';
@import '~ims-app-base/style/fonts/Montserrat/stylesheet.css';
@import 'remixicon/fonts/remixicon.css';
@import '~ims-creators/../assets/ims-icon-font/out/ims-icon-font.css';
@import '~ims-app-base/style/creators-colors.css';

.WebApp {
  height: 100vh;
  user-select: none;
}

.dropdown-host {
  z-index: 900;
  position: fixed;
}

.selectable-text {
  user-select: all;
}

.App-proTooltip {
  display: none;
}
.App-toasts {
  position: fixed;
  right: 50%;
  bottom: 0;
  transform: translateX(50%);
  pointer-events: none;
  z-index: 3000;
}
</style>
