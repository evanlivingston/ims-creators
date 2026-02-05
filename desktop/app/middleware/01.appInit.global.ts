import { defineNuxtRouteMiddleware, useNuxtApp } from '#app';

export default defineNuxtRouteMiddleware(async () => {
  const { $getAppManager } = useNuxtApp();
  await $getAppManager().init();
  return true;
});
