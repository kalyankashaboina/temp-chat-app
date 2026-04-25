import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// ─────────────────────────────────────────────────────────────────────────────
// Manual chunk strategy
//
// Root cause of circular warnings:
//
//   vendor → react-core → vendor
//     Some node_modules (e.g. use-sync-external-store, which is a redux peer)
//     import from react internals. Keeping react + redux in ONE chunk
//     eliminates the react-core ↔ redux cycle too.
//
//   vendor → socket → vendor
//     engine.io-client / socket.io-parser import from each other via
//     the "vendor" fallback. Merging socket deps into vendor fixes this.
//
// Strategy:
//   - Merge react-core + redux into a single "framework" chunk
//     (they're always loaded together anyway)
//   - Do NOT give socket its own chunk — let it fall into vendor
//   - Keep radix, forms, motion, markdown, dates isolated (no cycles)
// ─────────────────────────────────────────────────────────────────────────────
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;

  // ── Framework: React + Router + Redux in one chunk ───────────────────────
  // Merged to eliminate the react-core ↔ redux ↔ vendor triangle.
  // These are always needed together and loaded on every page anyway.
  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/react-router/") ||
    id.includes("/react-router-dom/") ||
    id.includes("/scheduler/") ||            // react-dom internal
    id.includes("/redux/") ||
    id.includes("/@reduxjs/") ||
    id.includes("/react-redux/") ||
    id.includes("/reselect/") ||             // RTK internal
    id.includes("/use-sync-external-store/") // redux/react-redux peer
  ) {
    return "framework";
  }

  // ── Radix UI ──────────────────────────────────────────────────────────────
  // Large, stable, only needed for UI rendering. No internal cycles.
  if (id.includes("/@radix-ui/")) {
    return "radix";
  }

  // ── Forms & validation ────────────────────────────────────────────────────
  // Only loaded on auth / settings pages.
  if (
    id.includes("/react-hook-form/") ||
    id.includes("/zod/") ||
    id.includes("/@hookform/")
  ) {
    return "forms";
  }

  // ── Animation ─────────────────────────────────────────────────────────────
  if (id.includes("/framer-motion/")) {
    return "motion";
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  if (id.includes("/recharts/") || id.includes("/d3-")) {
    return "charts";
  }

  // ── Date utils ────────────────────────────────────────────────────────────
  if (id.includes("/date-fns/") || id.includes("/react-day-picker/")) {
    return "dates";
  }

  // ── Markdown ──────────────────────────────────────────────────────────────
  if (
    id.includes("/react-markdown/") ||
    id.includes("/remark-") ||
    id.includes("/unified/") ||
    id.includes("/mdast") ||
    id.includes("/micromark") ||
    id.includes("/hast")
  ) {
    return "markdown";
  }

  // ── Socket.io → vendor ────────────────────────────────────────────────────
  // Intentionally NOT given its own chunk. engine.io-client and
  // socket.io-parser have internal cross-imports that produce a
  // vendor → socket → vendor cycle when isolated. Merging into vendor
  // collapses the cycle. Vendor is still loaded once; no regression.

  // Everything else (axios, clsx, lucide, sonner, socket.io, etc.)
  return "vendor";
}

// ─────────────────────────────────────────────────────────────────────────────
// PWA / Workbox
// ─────────────────────────────────────────────────────────────────────────────
const pwaConfig = VitePWA({
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
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },

  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    navigateFallback: "/index.html",

    // Never intercept API or socket routes — critical for realtime chat.
    navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],

    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,

    runtimeCaching: [
      {
        // Avatars / uploaded media — stable, serve from cache
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "media-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // REST API — always prefer network; fall back offline
        urlPattern: /\/api\//,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60,
          },
        },
      },
      {
        // Google Fonts / CDN — long-lived
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "font-cache",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main config
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig(({ mode }): UserConfig => {
  const isDev = mode === "development";

  return {
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      hmr: { overlay: true },
      // Uncomment to proxy API + socket in dev (avoids CORS):
      // proxy: {
      //   "/api":       { target: "http://localhost:3000", changeOrigin: true },
      //   "/socket.io": { target: "http://localhost:3000", ws: true },
      // },
    },

    plugins: [
      react(),
      !isDev && pwaConfig,
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
      cssMinify: true,
      chunkSizeWarningLimit: 700,

      rollupOptions: {
        output: {
          manualChunks,
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
        onwarn(warning, defaultHandler) {
          // Suppress circular-dependency warnings that originate entirely
          // inside node_modules — these are third-party lib issues we
          // cannot fix, and they do not affect correctness.
          if (
            warning.code === "CIRCULAR_DEPENDENCY" &&
            warning.ids?.every((id) => id.includes("node_modules"))
          ) {
            return;
          }
          defaultHandler(warning);
        },
      },
    },

    define: {
      __DEV__: isDev,
    },

    esbuild: {
      drop: isDev ? [] : ["console", "debugger"],
      legalComments: "none",
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@reduxjs/toolkit",
        "react-redux",
        "framer-motion",
        "socket.io-client",
        "axios",
      ],
    },
  };
});