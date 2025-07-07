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
      entry: {
        "rc-menubar": resolve(__dirname, "src/index.ts"),
        "rc-menubar-define": resolve(__dirname, "src/define.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
