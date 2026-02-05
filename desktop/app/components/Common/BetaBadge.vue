<template>
  <div class="BetaBadge">beta</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BetaBadge',
})
</script>
<style lang="scss">
[data-theme="ims-light"] {
  .BetaBadge {
    --beta-badge-text-color: var(--local-bg-color);
    --beta-badge-bg-color: var(--color-danger);
  }
}
[data-theme="ims-dark"] {
  .BetaBadge {
    --beta-badge-text-color: var(--local-text-color);
    --beta-badge-bg-color: var(--color-danger);
  }
}
</style>
<style lang="scss" scoped>
.BetaBadge {
  font-weight: bold;
  background-color: var(--beta-badge-bg-color);
  color: var(--beta-badge-text-color);
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
}
</style>