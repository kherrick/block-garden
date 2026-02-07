#!/usr/bin/env node
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import process from "node:process";

const MAX_LINES_TO_PARSE = 200000;

async function analyzeTrace(filePath) {
  console.log(`Analyzing: ${path.basename(filePath)}`);

  let json;
  try {
    // Try to read file and gunzip if needed
    const fileContent = fs.readFileSync(filePath);

    let text;

    try {
      const unzipped = zlib.gunzipSync(fileContent);

      text = unzipped.toString();
    } catch {
      // Not gzipped, read as plain text
      text = fileContent.toString();
    }

    json = JSON.parse(text);
  } catch (e) {
    console.error(`Error parsing trace ${filePath}:`, e.message);

    return;
  }

  const events = Array.isArray(json) ? json : json.traceEvents || [];
  const stats = {};

  for (let i = 0; i < events.length && i < MAX_LINES_TO_PARSE; i++) {
    const event = events[i];

    if (event.name === "FunctionCall" || event.name === "JSFrame") {
      const dur = event.dur || 0;
      let functionName = "Unknown";

      if (event.args?.data) {
        functionName =
          event.args.data.functionName || event.args.data.url || "Unknown";
      }

      if (functionName && functionName !== "Unknown") {
        if (!stats[functionName]) {
          stats[functionName] = { count: 0, totalDur: 0, maxDur: 0 };
        }

        stats[functionName].count++;
        stats[functionName].totalDur += dur;
        stats[functionName].maxDur = Math.max(stats[functionName].maxDur, dur);
      }
    }
  }

  const sortedStats = Object.entries(stats)
    .sort(([, a], [, b]) => b.totalDur - a.totalDur)
    .slice(0, 50);

  console.log("Top 50 most expensive JS functions (Total Duration in ms):");

  for (const [name, data] of sortedStats) {
    console.log(
      `- ${name}: ${(data.totalDur / 1000).toFixed(2)}ms (Count: ${
        data.count
      }, Max: ${(data.maxDur / 1000).toFixed(2)}ms)`,
    );
  }

  console.log();
}

// Entry point
const argv1 = process.argv[2];
if (!argv1) {
  console.error("Usage: node analyze-trace.mjs <tracefile.gz>");

  process.exit(1);
}

await analyzeTrace(argv1);
