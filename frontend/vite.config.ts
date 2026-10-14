
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    port: 5173,

    proxy: {
      "/about.json": { target: "http://127.0.0.1:8080" },
      "/api": {
        target: "http://127.0.0.1:8080",
        // OAuth checks must see the browser hostname so its session survives the callback.
        changeOrigin: false,
      },
    },
  },
});
