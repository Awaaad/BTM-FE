import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * VITE_BASE_PATH  where the built app is served from, e.g. "/btm-ui/".
 *                 Leave as "/" when it sits at the root of its own host.
 * VITE_API_BASE   prefix added to every API call at runtime (see src/config.ts).
 * BACKEND_URL     dev only: where the Spring Boot app is running.
 * BACKEND_CONTEXT dev only: the backend's server.servlet.context-path.
 */
export default defineConfig(({ mode }) => {
  // '.' resolves against the project root, avoiding a dependency on @types/node.
  const env = loadEnv(mode, '.', '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:8080'
  const backendContext = (env.BACKEND_CONTEXT ?? '/btm').replace(/\/$/, '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 5173,
      proxy: {
        // The app calls /api/... ; the backend serves it under its context
        // path. Rewriting here keeps dev free of CORS and keeps the same
        // relative URLs working in production behind a reverse proxy.
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => `${backendContext}${path}`,
        },
      },
    },
  }
})
