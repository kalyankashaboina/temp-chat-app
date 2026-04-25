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

          includeAssets: ["favicon.svg", "icon-192.svg", "icon-512.svg"],

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
                src: "/favicon.svg",
                sizes: "32x32",
                type: "image/svg+xml",
              },
              {
                src: "/icon-192.svg",
                sizes: "192x192",
                type: "image/svg+xml",
              },
              {
                src: "/icon-512.svg",
                sizes: "512x512",
                type: "image/svg+xml",
              },
            ],
          },

          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            navigateFallback: "/index.html",
            cleanupOutdatedCaches: true,
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

      // SIMPLE + SAFE chunking
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },

    define: {
      __DEV__: isDev,
    },

    esbuild: {
      drop: isDev ? [] : ["console", "debugger"],
    },
  };
});