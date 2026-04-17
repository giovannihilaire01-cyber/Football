import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Football/',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    target: 'ES2020',
    minify: 'terser',
  },
});
