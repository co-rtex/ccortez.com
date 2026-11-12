/// <reference types="vitest/config" />
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  plugins: [
    {
      ...mdx(),
      enforce: 'pre',
    },
    react({
      include: /\.(mdx|js|jsx|ts|tsx)$/,
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep modules the HUD needs at startup (state store, preload helper) out of the 3D vendor
          // chunks, so three.js only downloads with the lazily loaded scene.
          if (id.includes('node_modules/zustand') || id.includes('vite/preload-helper')) {
            return 'react-vendor';
          }

          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }

          if (id.includes('@react-three')) {
            return 'r3f-vendor';
          }

          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }

          return undefined;
        },
      },
    },
  },
});
