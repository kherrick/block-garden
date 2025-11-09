#!/usr/bin/env bash

# change directory to the project root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." || exit 1

isSingle=false
if [[ "$1" == "single" ]]; then
  isSingle=true;
fi

npm run clean \
  && npm run copy:404 \
  && npm run copy:about \
  && npm run copy:index:assets \
  && npm run copy:index:license \
  && npm run copy:index:manifest \
  && npm run copy:index:readme \
  && npm run copy:index:robots \
  && npm run copy:index:llms \
  && npm run copy:index:sitemap \
  && npm run copy:index:unbundled \
  && npm run copy:pkg \
  && npm run copy:privacy \
  && npm run copy:service-worker \
  && npm run copy:deps \
  && npm run copy:src \
  && npm run copy:src:index \
  || exit 1

if [[ "$isSingle" == "true" ]]; then
  npm run build:single:bundle \
    || exit 1
fi

npm run bundle \
  || exit 1

if [[ "$isSingle" == "true" ]]; then
  npm run build:single:index \
    || exit 1
fi

npm run copy:index \
  exit 1

if [[ "$isSingle" == "false" ]]; then
  npm run build:script:index \
    || exit 1
fi

npm run build:base:index \
  && npm run build:base:index:unbundled \
  && npm run build:base:about \
  && npm run build:base:privacy \
  && npm run build:gh-pages:nojekyll \
  && npm run minify:index \
  && npm run minify:404 \
  && npm run minify:about \
  && npm run minify:privacy \
  && npm run build:service-worker \
  && npm run clean:service-worker \
  || exit 1

if [[ "$isSingle" == "true" ]]; then
  npm run build:single:bundle:clean \
    && npm run build:single:index:clean \
    || exit 1
fi
