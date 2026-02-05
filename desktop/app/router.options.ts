import type { RouterConfig } from '@nuxt/schema';

export default {
  hashMode: true,
  scrollBehavior: (to) => {
    if (to.hash) {
      const anchor_element = window.document.getElementById(
        to.hash.replace(/^#/, ''),
      );
      anchor_element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({
        left: 0,
        top: 0,
        behavior: 'smooth',
      });
    }
  },
} satisfies RouterConfig;
