import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// AfterFire build config. Base is relative so the print/export build
// works when opened from a static host or file path.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
  },
})
