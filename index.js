const Socket = require('./Socket')

async function start(){
   
   const bot = new Socket({
      path: 'Socket/Sesion',
      phone: '',
      prefix: '/'
   })
   bot.ev.on('code',console.log)
   bot.ev.on('status',console.log)
   
   bot.start()
   console.log(bot)
}

start()