import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "index.mjs",
    output: {
      file: "dist/block-garden-bundle-min.mjs",
      format: "esm",
      sourcemap: false,
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
];
