import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/renderer/index.ts"],
  bundle: true,
  outfile: "renderer.js",
  platform: "browser",
  target: "chrome128",
  format: "iife",
});
