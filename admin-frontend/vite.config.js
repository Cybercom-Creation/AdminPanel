import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  // Load .env files
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
    proxy: {
      // Proxy API requests starting with /admin or /api to your backend
      '/admin': {
        target: 'http://localhost:5001', // Your backend server
        changeOrigin: true,
        secure: false,      
      },
      '/api': { 
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
    define: {
      
      'process.env.API_URL': JSON.stringify(env.API_URL || 'http://localhost:5001')
      
    }
  };
});
