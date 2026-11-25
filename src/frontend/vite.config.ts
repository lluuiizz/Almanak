import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockApiPlugin } from './mockApiPlugin.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const usarMockApi = mode === 'mock'

  return {
    plugins: [react(), ...(usarMockApi ? [mockApiPlugin()] : [])],
    ...(usarMockApi
      ? {
          define: {
            'import.meta.env.VITE_API_URL': JSON.stringify('/__mock_api'),
          },
        }
      : {}),
    server: {
      // Aceita conexões de fora do container (Docker / docker compose)
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Garante hot reload quando montado via volume no Docker
      watch: { usePolling: true },
    },
  }
})

