#!/usr/bin/env node

// dev server
import compression from "compression";
import cors from "cors";
import express from "express";
import expressUrlrewrite from "express-urlrewrite";
import fs from "node:fs";
import path from "node:path";
import { argv, exit } from "node:process";
import { fileURLToPath } from "node:url";

import tcpPortUsed from "tcp-port-used";

// get details for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create an express application
const app = express();

// define a port
let port = Number(argv[2]) || 3000;

if (port < 1024 || port > 65535) {
  console.error("Port must be between 1024 and 65535.");

  exit(1);
}

// enable CORS
const allowedOrigins = ["http://localhost:3000", "http://localhost:4200"];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject other origins
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

// enable compression
app.use(compression());

// parse JSON bodies
app.use(express.json());

// rewrite rule to remove index.html
app.use(expressUrlrewrite(/^(.+)\/index\.html$/, "$1/"));

app.use((req, res, next) => {
  // set Cache-Control header for static assets:
  // res.setHeader('Cache-Control', 'max-age=31536000');

  // for dynamic content; this allows caching but checks with the server for updates
  res.setHeader("Cache-Control", "no-cache");

  // remove /src from the request url
  const filePath = path.join(__dirname, path.sep, "..", path.sep, req.url);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      next();
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      fs.access(indexPath, fs.constants.F_OK, (err) => {
        if (!err) {
          res.sendFile(indexPath);
        } else {
          next();
        }
      });
    } else {
      res.sendFile(filePath);
    }
  });
});

// serve static files from the 'src' directory
app.use(
  express.static(path.join(__dirname, path.sep, "..", path.sep), {
    etag: true,
  }),
);

const isPortUsed = await tcpPortUsed.check(port, "0.0.0.0");
if (isPortUsed) {
  console.error(
    `Port ${port} is currently being used. Try passing a different port as the first argument.`,
  );

  exit(1);
}

// start the server
app.listen(port, () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
