#!/bin/sh
set -e
command -v node >/dev/null || { echo "Install Node.js"; exit 1; }
if [ ! -f node_modules/.package-lock.json ]; then
  echo "Installing packages..."
  npm install telegraf express axios ua-parser-js
fi
node mo-tool.js
