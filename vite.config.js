import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // 默认按 nginx 子路径部署；部署到根域名的平台（Render 等）时用 VITE_BASE='/' 构建
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true
      }
    }
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString()
          }
        },
        chunkFileNames: 'static8/js/chunk-[hash].js',
        entryFileNames: 'static8/js/main.[hash].js',
        assetFileNames: 'static8/css/[name].[hash].[ext]'
      }
    }
  }
})
