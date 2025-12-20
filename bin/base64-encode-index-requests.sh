#!/usr/bin/env bash

# change directory to the project root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." || exit 1

if [[ $1 == "encode-all" ]]; then
  base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/assets/icons/favicon.ico)" \
    && bin/file-search-replace.mjs 'href="assets/icons/favicon.ico"' "index.html" 'href="data:image/png;base64,' "$base64Encoded\"" \
    || exit 1
fi

base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/dist/block-garden-bundle-min.mjs)" \
  && printf '%s\"' "$base64Encoded" | bin/file-search-replace.mjs 'src="./index.mjs"' "index.html" 'src="data:text/javascript;base64,' \
  || exit 1
