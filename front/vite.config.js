import { defineConfig } from 'vite';

export default defineConfig({
  base: '/inventarios/',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});