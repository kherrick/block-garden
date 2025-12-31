#!/usr/bin/env bash

# change directory to the project root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." || exit 1

base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/deps/qrcode.mjs)" \
  && bin/file-search-replace.mjs "https://kherrick.github.io/block-garden/deps/qrcode.mjs" "src/api/BlockGarden.mjs" 'data:text/javascript;base64,' "$base64Encoded" \
  || exit 1

grep -Rl 'fetch(' src/** | while IFS= read -r filename; do
  if [[ "$filename" == "src/dialog/examples.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/src/api/examples/)" \
      && bin/file-search-replace.mjs 'fetch\(\`\$\{path\}\/\$\{part\}\`\)' "$filename" 'fetch("data:text/html;base64,' "$base64Encoded\")" \
      || exit 1
  fi

  if [[ "$filename" == "src/init/game.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/package.json)" \
      && bin/file-search-replace.mjs 'fetch\("package.json"\)' "$filename" 'fetch("data:application/json;base64,' "$base64Encoded\")" \
      || exit 1
  fi
done
