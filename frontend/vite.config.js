import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server for the rep mobile app prototype.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
