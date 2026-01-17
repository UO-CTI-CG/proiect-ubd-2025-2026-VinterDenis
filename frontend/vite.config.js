import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Portul pe care va rula interfața de desktop
    port: 5173,
    // Deschide automat browser-ul la pornire
    open: true
  }
})