import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The local 2KOT server (../2kot-server) owns the data; see its README.
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
