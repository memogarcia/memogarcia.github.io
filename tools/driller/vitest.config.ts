import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
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
})