import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3'],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}) 