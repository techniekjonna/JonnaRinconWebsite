import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: true,
    },
    fs: {
      strict: false,
    },
    proxy: {
      '/api/upload-post': {
        target: 'https://api.upload-post.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upload-post/, '/api'),
        headers: {
          'Authorization': `Apikey ${process.env.UPLOAD_POST_API_KEY || ''}`,
        },
      },
    },
  },
});
