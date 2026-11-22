#!/bin/sh
# Builds the minified app.js (what the site serves) from src/app.js.
# Usage: ./build.sh            (requires: npm i -g terser)
set -e
cd "$(dirname "$0")"
terser src/app.js --compress passes=2 --mangle --keep-fnames --keep-classnames \
  --source-map "url='app.js.map',includeSources" --output app.js
echo "app.js: $(wc -c < src/app.js) -> $(wc -c < app.js) bytes"
