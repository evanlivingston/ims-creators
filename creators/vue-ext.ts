import type {
  ComponentCustomOptions as _ComponentCustomOptions,
  ComponentCustomProperties as _ComponentCustomProperties,
} from 'vue';
import type { BaseAppConfiguration } from '~ims-app-base/logic/configurations/base-app-configuration';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';

declare module '#app' {
  interface NuxtApp {
    $getAppManager: () => IAppManager;
    $appConfiguration: BaseAppConfiguration;
    $tTitle: (title: string) => string;
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties extends _ComponentCustomProperties {
    $getAppManager: () => IAppManager;
    $appConfiguration: BaseAppConfiguration;
    $tTitle: (title: string) => string;
  }
  interface ComponentCustomOptions extends _ComponentCustomOptions {}
}
