
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },

    plugins: [
      react(),

      !isDev &&
        VitePWA({
          registerType: "autoUpdate",

          includeAssets: ["favicon.ico", "placeholder.svg"],

          manifest: {
            name: "Relay Chat",
            short_name: "Relay",
            description: "Real-time chat application",
            theme_color: "#1a1a2e",
            background_color: "#1a1a2e",
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            start_url: "/",
            icons: [
              {
                src: "/placeholder.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any maskable",
              },
              {
                src: "/placeholder.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any maskable",
              },
            ],
          },

          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

            navigateFallback: "/index.html",

            skipWaiting: true,
            clientsClaim: true,
            cleanupOutdatedCaches: true,

            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*/,
                handler: "NetworkFirst",
                options: {
                  cacheName: "api-cache",
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60,
                  },
                  networkTimeoutSeconds: 10,
                },
              },
            ],
          },
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      target: "esnext",
      sourcemap: false, 
      minify: "esbuild",

      cssCodeSplit: true,
      chunkSizeWarningLimit: 800,

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("react") ||
                id.includes("react-dom") ||
                id.includes("react-router")
              ) {
                return "react-core";
              }

              if (id.includes("@reduxjs") || id.includes("redux")) {
                return "redux";
              }

              if (id.includes("@radix-ui")) {
                return "ui-lib";
              }

              return "vendor";
            }
          },

          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },

    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["@radix-ui"], 
    },

    define: {
      __DEV__: isDev,
    },

    esbuild: {
      drop: isDev ? [] : ["console", "debugger"],
    },
  };
});

