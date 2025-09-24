/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Next.js artifacts
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/public/**',
      '**/*.config.{js,ts,mjs}',
      '**/next-env.d.ts',
      // Vercel artifacts
      '**/.vercel/**',
      // Additional build artifacts
      '**/.turbo/**',
      '**/tsconfig.tsbuildinfo'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/eslint.config.*',
        // Next.js artifacts
        '**/.next/**',
        '**/out/**',
        '**/build/**',
        '**/public/**',
        '**/next-env.d.ts',
        // Vercel artifacts
        '**/.vercel/**',
        // Build artifacts
        '**/.turbo/**',
        '**/tsconfig.tsbuildinfo',
        // Generated files
        '**/generated/**',
        '**/auto-generated/**'
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/lib': resolve(__dirname, './app/lib'),
      '@/lib/*': resolve(__dirname, './app/lib/*'),
      '@/types': resolve(__dirname, './types'),
      '@/types/*': resolve(__dirname, './types/*'),
      '@/components': resolve(__dirname, './app/components'),
      '@/components/*': resolve(__dirname, './app/components/*'),
      '@/contexts/*': resolve(__dirname, './app/contexts/*'),
      '@/hooks/*': resolve(__dirname, './app/hooks/*'),
      '@/api/*': resolve(__dirname, './app/api/*'),
    },
  },
})
