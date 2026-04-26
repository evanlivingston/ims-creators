import { fileURLToPath } from 'node:url';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  srcDir: 'app/',
  ssr: false,

  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],

  extends: [
    '../ims-app-base',
    '../creators',
  ],

  imports: {
    autoImport: false,
  },

  components: {
    dirs: [],
  },

  nitro: {
    preset: 'node-server',
    alias: {
      '~ims-app-base': fileURLToPath(
        new URL('../ims-app-base/app', import.meta.url),
      ),
    },
  },

  serverDir: 'server',

  alias: {
    '#components': fileURLToPath(new URL('../ims-app-base/app/components', import.meta.url)),
    '#logic': fileURLToPath(new URL('../ims-app-base/app/logic', import.meta.url)),
    '~ims-app-base': fileURLToPath(
      new URL('../ims-app-base/app', import.meta.url),
    ),
    '~ims-creators': fileURLToPath(
      new URL('../creators/app', import.meta.url),
    ),
    '~ims-plugin-base': fileURLToPath(
      new URL('../ims-app-base/ims-plugins/base', import.meta.url),
    ),
    '~ims-plugin-creators': fileURLToPath(
      new URL('../creators/ims-plugins/creators', import.meta.url),
    ),
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '#components/*': ['../app/components/*'],
          '#logic/*': ['../app/logic/*'],
          '~ims-app-base/*': ['../ims-app-base/app/*'],
          '~ims-creators/*': ['../creators/app/*'],
          '~ims-plugin-base/*': ['../ims-app-base/ims-plugins/base/*'],
          '~ims-plugin-creators/*': ['../creators/ims-plugins/creators/*'],
        },
      },
    },
  },

  runtimeConfig: {
    projectPath: process.env.PROJECT_PATH || '',
    public: {
      APP_CONFIGURATION_NAME: 'creators',
      AUTH_API_HOST: '',
      CREATORS_API_HOST: '',
      FILE_STORAGE_API_HOST: '',
      SUPERVISOR_API_HOST: '',
      GAMEMANAGER_API_HOST: '',
      SPACE_API_HOST: '',
      PROJECT_TEMPLATES_LINK: '',
    },
  },

  vite: {
    plugins: [
      nodePolyfills({
        include: ['path'],
      }),
    ],
    server: {
      fs: {
        allow: [
          fileURLToPath(new URL('..', import.meta.url)),
        ],
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    resolve: {
      dedupe: [
        'vue',
        'vue-router',
      ],
    },
  },

  i18n: {
    strategy: 'no_prefix',
    vueI18n: '../i18n/i18n.config.ts',
    detectBrowserLanguage: false,
  },
});
