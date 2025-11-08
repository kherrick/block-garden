#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { argv, chdir, exit } from "node:process";
import { fileURLToPath } from "node:url";

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataProjectRoot = join(__dirname, "..");

chdir(dataProjectRoot);

const [, script, filename, tagName, attribute, newValue] = argv;

function usage() {
  console.error(`${script} [filename] [attribute] [new-value] [tagName]`);
}

if (!filename || !attribute || !newValue || !tagName) {
  usage();

  exit(1);
}

const htmlString = await readFile(filename, "utf-8");
const doc = new DOMParser().parseFromString(htmlString, "text/html");
const elements = doc.getElementsByTagName(tagName);
const element = elements[elements.length - 1];

if (!element) {
  console.error(`<${tagName}> tag not found in the document.`);

  usage();

  exit(1);
}

element.setAttribute(attribute, newValue);

const newHtmlString = new XMLSerializer().serializeToString(doc);

await writeFile(filename, newHtmlString, "utf-8");

console.log(
  `<${tagName} ${attribute}> updated in "${filename}" to "${newValue}"`,
);
