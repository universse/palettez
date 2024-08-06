import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm", "iife"],
  esbuildOptions(options) {
    options.globalName = "palettez";
  },
  minify: true,
});
