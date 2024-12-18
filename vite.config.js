import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unimport from 'unimport/unplugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
