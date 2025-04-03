import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unimport from 'unimport/unplugin'
import { SERVER_URL } from './src/const.js'

import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    Unimport.vite({
      addons: {
        vueTemplate: true
      },
      imports: [{ name: 'push', from: 'notivue' }]
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: SERVER_URL,
        changeOrigin: true
      }
    }
  }
})
