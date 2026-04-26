import { defineNuxtPlugin, useCookie, type CookieRef } from '#app';
import type { IAppManager } from '~ims-app-base/logic/managers/IAppManager';
import type { Router } from 'vue-router';
import type { VueI18n } from 'vue-i18n';
import type { BaseAppConfiguration } from '~ims-app-base/logic/configurations/base-app-configuration';
import type { ICookieContainer } from '~ims-app-base/logic/types/ICookieContainer';
import createWebAppManager from '../logic/managers/createWebAppManager';

export default defineNuxtPlugin({
  name: 'appManager',
  dependsOn: ['appConfiguration'],
  async setup(app) {
    const cookie_controller: ICookieContainer = {
      get(name) {
        const cookies_raw = localStorage.getItem('cookies');
        let cookies: { [key: string]: any } = {};
        if (cookies_raw) {
          try {
            cookies = JSON.parse(cookies_raw);
          } catch {
            // Do nothing
          }
        }
        return cookies[name];
      },
      set(name, value, opts) {
        const cookies_raw = localStorage.getItem('cookies');
        let cookies: { [key: string]: any } = {};
        if (cookies_raw) {
          try {
            cookies = JSON.parse(cookies_raw);
          } catch {
            // Do nothing
          }
        }
        cookies[name] = value;
        localStorage.setItem('cookies', JSON.stringify(cookies));
      },
      remove(name, opts) {
        let val!: CookieRef<string | null>;
        app.runWithContext(() => {
          val = useCookie(name, {
            decode: (val) => val,
            encode: (val) => val,
            domain: opts?.domain,
            expires: opts?.expires,
            path: opts?.path,
          });
        });
        val.value = null;
      },
    };
    const app_configuration = (app as any)
      .$appConfiguration as BaseAppConfiguration;
    const app_manager = createWebAppManager(
      {
        $i18n: app.$i18n as VueI18n,
        $router: app.$router as Router,
        $cookies: cookie_controller,
        $env: app.$config.public as any,
        runWithContext: (...args) => app.runWithContext(...args),
      },
      app_configuration,
    );
    const getAppManager = (): IAppManager => {
      return app_manager;
    };
    app.vueApp.config.globalProperties.$getAppManager = getAppManager;
    (app as any).$appManager = app_manager;
    (app as any).getAppManager = getAppManager;

    return {
      provide: {
        getAppManager,
      },
    };
  },
});
