import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Aumenta limite de aviso de asset para evitar falsos positivos no build
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: "Salão CashBack - Gestão de Barbearias",
        short_name: "SalãoCashBack",
        description:
          "Sistema completo de gestão para barbearias com cashback, agendamentos e pagamentos.",
        theme_color: "#D4AF37",
        background_color: "#0A0A0B",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["business", "productivity"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Aumenta aviso de chunk para 600KB (era 500KB padrão)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /**
         * Code splitting manual:
         * - Separa vendedores pesados em chunks individuais
         * - O browser pode cachear cada chunk independentemente
         * - Dashboards são lazy-loaded via React.lazy no App.tsx
         */
        manualChunks: (id) => {
          // Chunk: React core (menor, mais cacheável)
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }

          // Chunk: Supabase client (raramente muda)
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }

          // Chunk: UI pesada — Radix + shadcn (raramente muda)
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }

          // Chunk: Animações — Framer Motion (opcional, carregado sob demanda)
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-framer";
          }

          // Chunk: Charts — Recharts
          if (
            id.includes("node_modules/recharts/") ||
            id.includes("node_modules/d3-")
          ) {
            return "vendor-charts";
          }

          // Chunk: TanStack Query
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }

          // Chunk: Utilitários de formulários
          if (
            id.includes("node_modules/react-hook-form/") ||
            id.includes("node_modules/@hookform/") ||
            id.includes("node_modules/zod/")
          ) {
            return "vendor-forms";
          }

          // Chunk: Ícones (lucide é grande)
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }

          // Chunk: i18n
          if (
            id.includes("node_modules/i18next") ||
            id.includes("node_modules/react-i18next")
          ) {
            return "vendor-i18n";
          }

          // Chunk: date/utils
          if (id.includes("node_modules/date-fns/")) {
            return "vendor-date";
          }
        },
      },
    },
  },
}));
