import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Uncomment the following line to use the built version instead of the source
      arto: resolve(__dirname, '../../packages/arto/src/index.ts'),
    },
  },
})
