#!/bin/sh
set -e
command -v node >/dev/null || { echo "Install Node.js: pkg install nodejs"; exit 1; }
if [ ! -d node_modules ]; then
  echo "Installing packages..."
  npm install telegraf express localtunnel axios ua-parser-js
fi
clear
node mo-tool.js
