import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // 允许局域网其他设备访问（不只本机 localhost）
    host: '0.0.0.0',
    port: 3000,
    open: true,
    strictPort: true
  }
})

