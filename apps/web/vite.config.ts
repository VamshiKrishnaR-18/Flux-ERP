import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseConfig = defineConfig({
  plugins: [react()]
})

export default {
  ...baseConfig,
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true
  }
} as import('vite').UserConfig & {
  test: {
    environment: string
    setupFiles: string
    globals: boolean
  }
}