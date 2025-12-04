import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use VITE_BASE_PATH env var for base path
// Vercel: base = '/' (root)
// GitHub Pages: base = '/LACS-WORLD-3/' (repository name)
const base = process.env.VITE_BASE_PATH || 
             (process.env.VERCEL ? '/' : '/LACS-WORLD-3/')

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: '0.0.0.0',
    port: 4500,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    cssTarget: 'safari14',
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    copyPublicDir: true,
  },
  publicDir: 'public',
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})