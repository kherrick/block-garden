#!/usr/bin/env bash

# change directory to the project root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." || exit 1

npm run clean \
  && npm run copy:404 \
  && npm run copy:about \
  && npm run copy:index:assets \
  && npm run copy:index:license \
  && npm run copy:index:manifest \
  && npm run copy:index:readme \
  && npm run copy:index:robots \
  && npm run copy:index:sitemap \
  && npm run copy:index:styles \
  && npm run copy:index \
  && npm run copy:pkg \
  && npm run copy:privacy \
  && npm run copy:service-worker \
  && npm run copy:deps \
  && npm run copy:src \
  && npm run copy:src:index \
  && npm run build:gh-pages:nojekyll \
  && npm run build:script:index \
  && npm run build:base:index \
  && npm run build:base:about \
  && npm run build:base:privacy \
  && npm run minify:index \
  && npm run minify:404 \
  && npm run minify:about \
  && npm run minify:privacy \
  && npm run bundle \
  && npm run build:service-worker \
  && npm run clean:service-worker
