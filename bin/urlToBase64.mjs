#!/usr/bin/env node

import { arrayBufferToBase64 } from "../src/util/conversion.mjs";

import { argv } from "node:process";

const [, , url] = argv;

let response = "";

try {
  response = await fetch(url);
} catch (e) {
  const message = e?.message
    ? `${e.message}\n`
    : "First argument should be a valid URL that is reachable from this script.\n";

  console.error(message);
}

if (!response.ok) {
  throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
}

const arrayBuffer = await response.arrayBuffer();

console.log(arrayBufferToBase64(globalThis, arrayBuffer));
