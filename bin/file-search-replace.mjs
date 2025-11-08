#!/usr/bin/env node

import { argv, chdir, exit, stdin } from "node:process";
import { dirname, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataProjectRoot = join(__dirname, "..");

chdir(dataProjectRoot);

async function readStdin() {
  const chunks = [];

  for await (const chunk of stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  const args = argv.slice(2);

  if (args.length < 3) {
    console.error(
      "Usage: node file-search-replace <searchPattern> <filePath> <prepend> [replacement]",
    );
    console.error(
      "If replacement omitted, reads replacement string from stdin pipe.",
    );

    exit(1);
  }

  const [searchPatternStr, filePath, prepend, maybeReplacement] = args;
  const searchPattern = new RegExp(searchPatternStr, "g");
  const replacement = maybeReplacement ?? (await readStdin());

  let content = await readFile(filePath, "utf8");

  content = content.replace(searchPattern, `${prepend}${replacement}`);

  await writeFile(filePath, content, "utf8");

  console.log(`Replaced content in: ${filePath}`);
}

main().catch((e) => {
  console.error(e);

  exit(1);
});
