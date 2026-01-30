#!/bin/sh
set -e

# التحقق من Node.js
command -v node >/dev/null || { echo "Install Node.js: pkg install nodejs ngrok"; exit 1; }

# تثبيت الحزم (مرة واحدة)
if [ ! -d node_modules ]; then
  echo "Installing packages for the first time..."
  npm install telegraf express axios ua-parser-js ngrok
fi

clear
echo "=== Mo-Tool Setup ==="
node mo-tool.js
