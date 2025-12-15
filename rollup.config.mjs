import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

const external = ["https://kherrick.github.io/sprite-garden/deps/qrcode.mjs"];

export default [
  {
    input: "index.mjs",
    output: {
      file: "dist/sprite-garden-bundle-min.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
  {
    input: "src/api/index.mjs",
    output: {
      file: "dist/src/api/sprite-garden-api-bundle-min.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
  {
    input: "src/api/train/index.mjs",
    output: {
      file: "dist/src/api/train/sprite-garden-train-bundle-min.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
  {
    input: "src/api/examples/index.mjs",
    output: {
      file: "dist/src/api/examples/sprite-garden-examples-bundle-min.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
  {
    input: "service-worker/init.mjs",
    output: {
      file: "dist/service-worker/init.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
  {
    input: "service-worker/share-target-handler.mjs",
    output: {
      file: "dist/service-worker/share-target-handler.mjs",
      format: "esm",
      sourcemap: false,
    },
    external,
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({ noEmitOnError: true }),
      terser(),
    ],
  },
];
