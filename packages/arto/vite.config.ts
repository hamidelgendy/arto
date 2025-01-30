import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'arto',
      formats: ['es', 'cjs', 'umd', 'iife'],
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, 'src/'),
    },
  },
  plugins: [
    dts({
      exclude: ['dist', 'node_modules', '**/__tests__/**', '**/*.spec.ts', '**/*.test.ts'],
    }),
  ],
})
