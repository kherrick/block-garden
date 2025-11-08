#!/usr/bin/env bash

# change directory to the project root
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." || exit 1

grep -Rl 'fetch(' src/** | while IFS= read -r filename; do
  if [[ "$filename" == "src/dialog/about.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/about/)" \
      && bin/file-search-replace.mjs 'fetch\(\part\)' "$filename" 'fetch("data:text/html;base64,' "$base64Encoded\")" \
      || exit 1
  fi

  if [[ "$filename" == "src/dialog/examples.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/src/api/examples/)" \
      && bin/file-search-replace.mjs 'fetch\(\`\$\{path\}\/\$\{part\}\`\)' "$filename" 'fetch("data:text/html;base64,' "$base64Encoded\")" \
      || exit 1
  fi

  if [[ "$filename" == "src/dialog/privacy.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/privacy/)" \
      && bin/file-search-replace.mjs 'fetch\(\part\)' "$filename" 'fetch("data:text/html;base64,' "$base64Encoded\")" \
      || exit 1
  fi

  if [[ "$filename" == "src/init/game.mjs" ]]; then
    # shellcheck disable=SC2016
    base64Encoded="$(bin/urlToBase64.mjs http://localhost:8080/package.json)" \
      && bin/file-search-replace.mjs 'fetch\("package.json"\)' "$filename" 'fetch("data:text/html;base64,' "$base64Encoded\")" \
      || exit 1
  fi
done
