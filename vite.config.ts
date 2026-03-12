import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/cashback-converters/' : '/',
  server: {
    host: "localhost",
    port: 8080,
    hmr: {
      overlay: false,
      port: 8080,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors grandes
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'lucide-vendor': ['lucide-react'],
          
          // Separar dashboards pesados
          'dashboard-dono': [
            './src/pages/dashboards/DonoDashboard.tsx',
            './src/pages/DonoDashboard/DividasPage.tsx'
          ],
          'dashboard-superadmin': [
            './src/pages/dashboards/SuperAdminDashboard.tsx'
          ],
          'dashboard-profissional': [
            './src/pages/dashboards/ProfissionalDashboard.tsx'
          ],
          'dashboard-cliente': [
            './src/pages/dashboards/ClienteDashboard.tsx'
          ],
          'dashboard-afiliado': [
            './src/pages/dashboards/AfiliadoDashboard.tsx'
          ],
          'dashboard-contador': [
            './src/pages/dashboards/ContadorDashboard.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development'
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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/acyumsqwduryrowpmtrq\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      manifest: {
        name: "Salão CashBack - Gestão de Barbearias",
        short_name: "SalãoCashBack",
        description: "Sistema completo de gestão para barbearias com cashback, agendamentos e pagamentos.",
        theme_color: "#D4AF37",
        background_color: "#0A0A0B",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
}));
