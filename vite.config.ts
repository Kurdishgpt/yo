import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ✅ Universal config (works for GitHub Pages, Vercel, Netlify)
export default defineConfig(({ command }) => ({
  root: path.resolve(import.meta.dirname, 'client'),
  base: '/', // Works for both development and Replit deployment
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client/src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
}))
