import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Universal config (works for GitHub Pages, Vercel, Netlify)
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/yo/' : '/', // For GitHub Pages repo
  plugins: [react()],
  build: {
    outDir: 'dist/public', // works with your deploy script
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
}))
