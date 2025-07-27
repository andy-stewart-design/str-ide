import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path"; // Import the 'path' module

// https://vitejs.dev/config
export default defineConfig({
  root: "./src",
  plugins: [svelte()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Maps '@' to the 'src' directory
      "@components": path.resolve(__dirname, "./src/components"), // Maps '@components' to 'src/components'
    },
  },
});
