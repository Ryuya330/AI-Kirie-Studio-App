import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // '/api' で始まるリクエストを http://localhost:3000 に転送する
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});