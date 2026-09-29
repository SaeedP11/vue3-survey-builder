import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [vue(), vueDevTools(), tailwindcss()],
  server: {
    // The devzone's end-to-end container reaches the playground by its
    // compose service name
    allowedHosts: ["form-builder"],
    fs: {
      allow: [fileURLToPath(new URL("../", import.meta.url))],
    },
  },
});