import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 7597,
    allowedHosts: ['iachat-v1.pulse7.ooo.ovh'],
    hmr: {
      host: 'iachat-v1.pulse7.ooo.ovh',
      protocol: 'wss',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7598',
        changeOrigin: true,
      },
    },
  },
})
