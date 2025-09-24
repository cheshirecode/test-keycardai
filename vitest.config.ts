/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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
      '@': resolve(__dirname, './src'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/lib/types'),
      '@/app': resolve(__dirname, './src/app'),
      '@/components': resolve(__dirname, './src/app/_components'),
    },
  },
})
