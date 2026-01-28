#!/bin/sh
set -e
command -v node >/dev/null || { echo "Please install Node.js (pkg install nodejs)"; exit 1; }
if [ ! -d node_modules ]; then
  echo "Installing packages..."
  npm install telegraf express axios ua-parser-js
fi
echo "Export your credentials then run:"
echo "  export TOKEN=YOUR_BOT_TOKEN"
echo "  export MASTER=YOUR_TELEGRAM_ID"
echo "  node mo-tool.js"
