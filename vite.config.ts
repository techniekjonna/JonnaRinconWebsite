import { defineConfig, loadEnv, type Plugin } from 'vite';
import { cloudUploadHandler } from './api/cloud-upload.js';
import { uploadPostHandler } from './api/upload-post.js';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// In preview/dev an old service worker from earlier visits can keep serving a
// stale cached page (blank screen). The browser re-checks /service-worker.js
// on every visit, so in dev we serve a "kill switch" version that clears all
// caches, unregisters itself and reloads the open tabs. Production builds are
// untouched and still use public/service-worker.js.
const devServiceWorkerKillSwitch = (): Plugin => ({
  name: 'dev-service-worker-kill-switch',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/service-worker.js') return next();
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-store');
      res.end(`self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});`);
    });
  },
});

// Runs the same /api/cloud-upload function as Vercel inside the dev/preview server.
// Credentials come from server env (OWNCLOUD_*), never from the browser bundle.
const devCloudUpload = (env: Record<string, string>): Plugin => ({
  name: 'dev-cloud-upload',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.includes('/api/cloud-upload')) return next();
      cloudUploadHandler(req, res, { ...process.env, ...env });
    });
  },
});

// Runs the same /api/upload-post function as Vercel (social planner). The API key
// comes from server env (UPLOAD_POST_API_KEY), never from the browser bundle.
const devUploadPost = (env: Record<string, string>): Plugin => ({
  name: 'dev-upload-post',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.includes('/api/upload-post')) return next();
      uploadPostHandler(req, res, { ...process.env, ...env });
    });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    devServiceWorkerKillSwitch(),
    devCloudUpload(loadEnv(mode, process.cwd(), 'OWNCLOUD_')),
    devUploadPost(loadEnv(mode, process.cwd(), 'UPLOAD_POST_')),
  ],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: true,
    },
    fs: {
      strict: false,
    },
  },
}));
