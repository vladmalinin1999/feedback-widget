import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  clean: true,
  target: "es2020",
  external: ["react", "react-dom", "react-konva", "konva", "html-to-image"],
});
