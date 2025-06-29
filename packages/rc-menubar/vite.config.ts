import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { copy } from "@guanghechen/rollup-plugin-copy";

export default defineConfig({
  plugins: [
    dts({ outDir: "dist/types" }),
    copy({
      targets: [
        {
          src: "../../demo-shared/**/*",
          dest: "public",
        },
      ],
      copyOnce: true,
    }),
  ],
  publicDir: resolve(__dirname, "public"),
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "rc-menubar",
      fileName: "rc-menubar",
    },
    rollupOptions: {
      // Exclude lit packages from bundling
      external: [/^@?lit(-\w+)?($|\/.+)/],
    },
  },
});
