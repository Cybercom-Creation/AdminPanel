import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  // Load .env files based on the mode (development, production)
  // process.cwd() is the root of your project.
  // The '' prefix means load all variables without any specific prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This will replace 'process.env.API_URL' in your client-side code
      // with the value of the API_URL environment variable.
      // JSON.stringify is important to ensure the value is correctly string-injected.
      'process.env.API_URL': JSON.stringify(env.API_URL || 'http://localhost:5001')
      // If you have other process.env variables you want to expose, add them similarly:
      // 'process.env.ANOTHER_VAR': JSON.stringify(env.ANOTHER_VAR)
    }
  };
});
