import { defineConfig, mergeConfig } from 'vite';
import { baseConfig } from './vite.base';
import { VitePWA } from 'vite-plugin-pwa';

export default mergeConfig(
  baseConfig,
  defineConfig({
    mode: 'production',

    define: {
      __DEV__: false,
    },

    build: {
      target: 'es2019', // modern JS, safe for browsers
      sourcemap: false,
      minify: 'esbuild',
      cssMinify: true,
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 700,
      assetsInlineLimit: 4096, // inline small assets for fewer requests

      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
            charts: ['recharts'],
            vendor: ['axios', 'socket.io-client'],
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },

    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',

        includeAssets: ['favicon.ico', 'relay-fav-icon.png', 'robots.txt'],

        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'script',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'js-cache' },
            },
            {
              urlPattern: ({ request }) => request.destination === 'style',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'css-cache' },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /\/api\/.*$/,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
            },
          ],
        },

        manifest: {
          name: 'Relay Chat',
          short_name: 'Relay',
          description: 'Modern real-time chat optimized for low networks.',
          theme_color: '#1a1a2e',
          background_color: '#0a0a0a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/pwa-icon.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-icon.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
  }),
);
