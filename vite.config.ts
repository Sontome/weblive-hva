import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["html2canvas"],
  },
  build: {
    rollupOptions: {
      external: [], // 👈 thêm dòng này nếu chưa có
    },
    commonjsOptions: {
      include: [/node_modules/, /html2canvas/],
    },
  },
}));
