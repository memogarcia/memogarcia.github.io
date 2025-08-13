import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/app': resolve(__dirname, './src/app'),
      '@/canvas': resolve(__dirname, './src/canvas'),
      '@/ai': resolve(__dirname, './src/ai'),
      '@/modes': resolve(__dirname, './src/modes'),
      '@/state': resolve(__dirname, './src/state'),
      '@/storage': resolve(__dirname, './src/storage'),
      '@/export': resolve(__dirname, './src/export'),
      '@/components': resolve(__dirname, './src/components'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
})