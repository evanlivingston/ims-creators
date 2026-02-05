import { defineNuxtPlugin } from '#app';
import logicalFocusOut from '~ims-app-base/directive/logicalFocusOut';
import logicalFocusIn from '~ims-app-base/directive/logicalFocusIn';

export default defineNuxtPlugin({
  name: 'directives',
  dependsOn: ['appManager'],
  async setup(app) {
    app.vueApp.directive('logical-focus-out', logicalFocusOut);
    app.vueApp.directive('logical-focus-in', logicalFocusIn);
    app.vueApp.directive('pro-function', { });
    
  },
});
