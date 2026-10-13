import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5184,
    strictPort: true,
    // Live tracking sends frames to the local 2KOT server (../2kot-server).
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
