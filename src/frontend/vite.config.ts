import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Aceita conexões de fora do container (Docker / docker compose)
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Garante hot reload quando montado via volume no Docker
    watch: { usePolling: true },
  },
})

