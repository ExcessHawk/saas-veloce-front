/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vitest configuration — runs unit + component tests with jsdom + RTL.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },

  // Pre-bundle heavy deps in dev so the browser doesn't stall on first load
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router',
      '@tanstack/react-query',
      'axios',
      'zustand',
      'zod',
      'date-fns',
      'next-themes',
      'sonner',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
  },

  build: {
    // Raise the warning threshold — react-dom alone is ~200KB gzipped in React 19
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Split react-dom from react-router so they can be cached independently
          if (id.includes('react-dom')) return 'react-dom';
          if (id.includes('react-router') || id.includes('@remix-run')) return 'react-router';
          if (id.includes('react/')) return 'react-core';
          if (id.includes('@tanstack')) return 'query-vendor';
          // lucide-react is already tree-shaken per page — keep it in the icons chunk
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@radix-ui') || id.includes('radix-ui')) return 'radix';
          if (id.includes('sonner') || id.includes('next-themes')) return 'ui-vendor';
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'forms';
          if (id.includes('date-fns')) return 'date-fns';
          if (id.includes('zustand') || id.includes('axios')) return 'state';
          return 'vendor';
        },
      },
    },
  },
})
