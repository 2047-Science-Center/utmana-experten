import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: false },
  // Två sidor: stationen (index.html) + spelledar-fönstret (spelledare.html,
  // öppnas på en annan skärm/enhet). Samma byggnad, samma origin.
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        spelledare: fileURLToPath(new URL('./spelledare.html', import.meta.url)),
      },
    },
  },
})
