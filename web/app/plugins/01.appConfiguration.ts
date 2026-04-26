import { defineNuxtPlugin } from '#app';
import CreatorsWebAppConfiguration from '../logic/configurations/creators-web-app-configuration';

export default defineNuxtPlugin({
  name: 'appConfiguration',
  async setup(app) {
    const app_configuration = new CreatorsWebAppConfiguration();
    app.vueApp.config.globalProperties.$appConfiguration = app_configuration;
    (app as any).$appConfiguration = app_configuration;

    return {
      provide: {
        appConfiguration: app_configuration,
      },
    };
  },
});
