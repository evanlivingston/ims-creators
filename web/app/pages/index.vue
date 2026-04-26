<template>
  <div class="web-loading">Loading project...</div>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports';

definePageMeta({
  name: 'web-index',
  middleware: async () => {
    return '/app/p/-/gdd/w/00000000-0000-0000-0000-200000000002';
  },
});
</script>

<style scoped>
.web-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 18px;
  color: #888;
}
</style>
