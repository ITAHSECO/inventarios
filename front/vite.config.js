import { defineConfig } from 'vite';

export default defineConfig({
  base: '/inventarios/front/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});