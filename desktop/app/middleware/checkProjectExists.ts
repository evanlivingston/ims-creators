import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#app';

export default defineNuxtRouteMiddleware(async (to) => {
  return true;
});
