#!/bin/sh
set -e
command -v node >/dev/null || { echo "Install Node.js (pkg install nodejs)"; exit 1; }
if [ ! -d node_modules ]; then
  echo "Installing packages..."
  npm install telegraf express axios ua-parser-js
fi
clear
echo "=== Mo-Tool Setup ==="
node mo-tool.js
