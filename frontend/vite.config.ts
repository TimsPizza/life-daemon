import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // Proxy /api requests to the backend server
      '/api': {
        target: 'http://localhost:3000', // Assuming backend runs on port 3000
        changeOrigin: true,
        // Optional: rewrite path if backend routes don't start with /api
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})
