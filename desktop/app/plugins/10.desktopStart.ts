import { defineNuxtPlugin } from '#app';
import { initImsHostClient } from '../init-imshost-client';

export default defineNuxtPlugin({
  name: 'desktopStart',
  dependsOn: ['appManager'],
  async setup(app) {
    await initImsHostClient();
    await window.imshost.window.show();
  },
});
