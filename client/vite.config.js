import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // In development the client calls same-origin "/api/..." and Vite forwards
    // it to the Express server. That keeps the browser free of CORS preflights
    // while developing; CORS is still configured server-side for deployments
    // where the two run on different origins.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
