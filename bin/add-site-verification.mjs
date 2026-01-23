#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { chdir } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataProjectRoot = join(__dirname, "..");

chdir(dataProjectRoot);

const id = "82a27a3b006d2d97";
const provider = "google";

await writeFile(
  join("dist", `${provider}${id}.html`),
  `${provider}-site-verification: ${provider}${id}.html`,
  "utf-8",
);
