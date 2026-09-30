import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const design = fileURLToPath(new URL("../../design", import.meta.url));

// 開發時 API 與 WebSocket 轉給 services/realtime（python -m elivo，port 8765；ELIVO_API 可改成另一個服務）
const api = process.env.ELIVO_API ?? "http://127.0.0.1:8765";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@design": design },
    dedupe: ["react", "react-dom"],   // design/ 的元件在專案外，React 仍用這裡的同一份
  },
  server: {
    port: 5173,
    fs: { allow: [".", design] },
    proxy: {
      "/api": api,
      "/ws": { target: api.replace(/^http/, "ws"), ws: true },
    },
  },
});
