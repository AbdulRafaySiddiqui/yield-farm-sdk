import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import external from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import pkg from "./package.json";
import json from "@rollup/plugin-json";
import typescript from '@rollup/plugin-typescript';

const extensions = [".ts", "tsx"];

export default {
  input: [pkg.source],
  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "es" },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      outputToFilesystem: true
    }),
    json(),
    external(),
    resolve({
      extensions,
    }),
    babel({
      exclude: "node_modules/**",
      babelHelpers: 'bundled',
    }),
    del({ targets: ["dist/*"] }),
  ],
  external: [Object.keys(pkg.dependencies || {})],
};
