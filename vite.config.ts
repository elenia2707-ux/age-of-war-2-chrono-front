import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
