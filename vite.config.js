import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      events: 'events',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify',
      url: 'url',
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'events',
      'crypto-browserify',
      'stream-browserify',
      'assert',
      'stream-http',
      'https-browserify',
      'os-browserify',
      'url',
    ],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about comments that Rollup cannot interpret
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      },
    },
  },
})
