import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  base: '/Football/',
  server: {
    port: 5173,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'ES2020',
    minify: 'terser',
  },
});
