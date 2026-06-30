import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ outDir: "dist/types" })],
  publicDir: process.env.NODE_ENV === 'production' ? false : resolve(__dirname, 'public'),
  build: {
    sourcemap: true,
    lib: {
      entry: {
        "rc-textarea": resolve(__dirname, "src/index.ts"),
        "rc-textarea-define": resolve(__dirname, "src/define.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // externalize lit and sibling packages; parchment is bundled
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
