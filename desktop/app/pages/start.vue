<template>
  <welcome-form/>
</template>

<script setup lang="ts">
import { definePageMeta } from '#imports';
import WelcomeForm from '../components/StartWork/WelcomeForm.vue';

definePageMeta({
  name: 'desktop-start',
});
</script>
