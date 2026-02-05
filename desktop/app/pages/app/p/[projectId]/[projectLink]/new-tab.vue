<template>
  <NewTab></NewTab>
</template>
<script setup lang="ts">
import { definePageMeta, useI18n, usePageHead } from '#imports';
import NewTab from '../../../../../components/Project/NewTab.vue';
const { t } = useI18n();

usePageHead(() => ({
  title: t('desktop.newTab.title') + ' | ' + 'IMS Creators',
}));

definePageMeta({
  name: 'project-new-tab',
  meta: {
    guest: true,
  },
});
</script>
