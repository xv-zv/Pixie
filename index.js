const Socket = require('./Socket')

async function start() {
   
   const bot = new Socket({
      path: './Sesion',
      phone: '527203011517'
   })
   
   bot.on('code', console.log)
   bot.on('status',console.log)
   
   bot.start()
}

start()