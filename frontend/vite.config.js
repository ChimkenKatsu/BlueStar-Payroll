import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forwards /api requests to the Express backend during local dev,
      // so the frontend can just call fetch('/api/...') with no CORS setup.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
