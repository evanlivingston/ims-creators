import { defineNuxtPlugin } from '#app';
import { convertTranslatedTitle } from '~ims-app-base/logic/utils/assets';

export default defineNuxtPlugin({
  name: 'tTitle',
  dependsOn: ['appManager'],
  async setup(app) {
    const app_manager = app.vueApp.config.globalProperties.$getAppManager();
    const $tTitle = (val: string): string => {
      return convertTranslatedTitle(val, (...args) => app_manager.$t(...args));
    };
    app.vueApp.config.globalProperties.$tTitle = $tTitle;

    return {
      provide: {
        tTitle: $tTitle
      },
    };
  },
});
