/* eslint-env node */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const backend = loadEnv(mode, process.cwd(), 'BACKEND_')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backend.BACKEND_DEV_PROXY_TARGET || 'http://127.0.0.1:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
