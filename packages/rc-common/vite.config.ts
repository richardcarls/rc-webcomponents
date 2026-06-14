import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ outDir: "dist/types" })],
  publicDir: resolve(__dirname, "public"),
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "rc-common",
      fileName: "rc-common",
    },
    rollupOptions: {
      // Exclude lit packages from bundling
      external: [/^@?lit(-\w+)?($|\/.+)/],
    },
  },
});
