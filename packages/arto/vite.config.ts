import { defineConfig } from 'vite'
import { resolve } from 'pathe'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'arto',
      formats: ['es', 'cjs', 'umd', 'iife'],
    },
  },
  resolve: {
    alias: {
      src: resolve('src/'),
    },
  },
  plugins: [dts()],
})
