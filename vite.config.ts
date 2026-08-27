/// <reference types="vite-ssg" />

import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs' // ← tambahkan ini

import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import { liveDesigner } from '@pinegrow/vite-plugin'
import AutoImportComponents from 'unplugin-vue-components/vite'
import AutoImportAPIs from 'unplugin-auto-import/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Layouts from 'vite-plugin-vue-layouts'
import Unocss from 'unocss/vite'
import presetIcons from '@unocss/preset-icons'
import { unheadVueComposablesImports } from '@unhead/vue'

import Markdown from 'unplugin-vue-markdown/vite'
import LinkAttributes from 'markdown-it-link-attributes'
import Shiki from 'markdown-it-shiki'
import VueDevTools from 'vite-plugin-vue-devtools'

// === Tambahkan Import Electron Plugins
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig({
  ssgOptions: {
    beastiesOptions: {
      // E.g., change the preload strategy
      preload: 'media',
      // Other options: https://github.com/danielroe/beasties#usage
    },
  },
  optimizeDeps: {
    exclude: ['puppeteer', '@puppeteer/browsers'],
  },
  plugins: [
    VueRouter({
      // routesFolder: 'src/pages', // default
      dts: 'typed-router.d.ts',
    }),
    /* IMPORTANT: Vue must be placed after VueRouter()  */
    Vue({
      include: [/\.vue$/, /\.md$/],
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'lite-youtube',
        },
      },
    }),
    Markdown({
      headEnabled: true,
      markdownItSetup(md) {
        // https://github.com/antfu/markdown-it-shiki
        md.use(Shiki, {
          // theme: {
          //   dark: 'min-dark',
          //   light: 'min-light',
          // },
        })
        md.use(LinkAttributes, {
          matcher: (link: string) => /^https?:\/\//.test(link),
          attrs: {
            target: '_blank',
            rel: 'noopener',
          },
        })
      },
    }),
    Layouts(),
    // For details, refer to https://github.com/antfu/unplugin-auto-import#configuration
    AutoImportAPIs({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
        /\.mdx$/, // .mdx
      ],
      imports: [
        'vue',
        VueRouterAutoImports, // Remove 'vue-router',
        // 'vue-i18n',
        // 'vue/macros',
        unheadVueComposablesImports,
        '@vueuse/core',
        'pinia',
      ],
      dirs: [
        /* Please ensure that you update the filenames and paths to accurately match those used in your project. */
        'src/composables',
        'src/utils',
        'src/stores',
        '**/pg-*/**', // To auto-import composables from Vue Designer plugins.
      ],
      vueTemplate: true,
      dts: 'auto-imports.d.ts',
    }),
    // For details, refer to https://github.com/antfu/unplugin-vue-components#configuration
    AutoImportComponents({
      /* Please ensure that you update the filenames and paths to accurately match those used in your project. */
      dirs: ['src/components'],

      // allow auto load markdown components under ./src/components/
      extensions: ['vue', 'md'],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/, /\.mdx?/],

      // resolvers: [], // Auto-import using resolvers
      dts: 'components.d.ts',
    }),
    Unocss({
      presets: [
        presetIcons({
          prefix: 'i-', // default prefix, do not change
        }),
      ],
      content: {
        pipeline: {
          include: ['./src/**/*'],
        },
      },
    }),
    VueDevTools(),
    liveDesigner({
      iconPreferredCase: 'unocss', // default value (can be removed), unocss by default uses the unocss format for icon names
      tailwindcss: {
        configPath: 'tailwind.config.ts',
        cssPath: '@/assets/css/tailwind.css',
        // themePath: false, // Set to false so that Design Panel is not used
        // restartOnConfigUpdate: true,
        restartOnThemeUpdate: true,
      },
    }),

    // === Integrasi Plugin Electron ===
    electron([
      {
        // Main process
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
              },
              external: [
                'serialport',
                '@serialport/bindings-cpp',
                '@serialport/parser-readline',
                'ws',
                'puppeteer',
              ],
            },
          },
        },
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.js',
            },
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.js',
                inlineDynamicImports: true,
              },
            },
          },
        },
      },
    ]),
    // JANGAN panggil renderer() di sini agar Vue tetap murni browser (ESM)
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '~~': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
