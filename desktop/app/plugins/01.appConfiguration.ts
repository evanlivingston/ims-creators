import { defineNuxtPlugin } from '#app';
import CreatorsDesktopAppConfiguration from '../logic/configurations/creators-desktop-app-configuration';

export default defineNuxtPlugin({
  name: 'appConfiguration',
  async setup(app) {
    const app_configuration = new CreatorsDesktopAppConfiguration();
    app.vueApp.config.globalProperties.$appConfiguration = app_configuration;
    (app as any).$appConfiguration = app_configuration;

    return {
      provide: {
        appConfiguration: app_configuration,
      },
    };
  },
});
