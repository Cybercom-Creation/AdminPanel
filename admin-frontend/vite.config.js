import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/a3b7x9z/', // <-- Add this line
  base: './', // <-- Add this line
})
