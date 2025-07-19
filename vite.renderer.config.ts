import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path"; // Import the 'path' module

// https://vitejs.dev/config
export default defineConfig({
  root: "./src",
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Maps '@' to the 'src' directory
      "@components": path.resolve(__dirname, "./src/components"), // Maps '@components' to 'src/components'
    },
  },
});
