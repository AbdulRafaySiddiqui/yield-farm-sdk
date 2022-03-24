import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import pkg from "./package.json";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import sourcemaps from "rollup-plugin-sourcemaps";

const extensions = [".ts", "tsx"];

export default {
  input: [pkg.source],
  output: [
    { file: pkg.main, format: "cjs", sourcemap: true },
    { file: pkg.module, format: "es", sourcemap: true },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      outputToFilesystem: true,
      sourceMap: true,
      inlineSourceMap: true,
      inlineSources: true,
    }),
    json(),
    external(),
    resolve({
      extensions,
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
    del({ targets: ["dist/*"] }),
    sourcemaps(),
  ],
  external: [Object.keys(pkg.dependencies || {})],
};
