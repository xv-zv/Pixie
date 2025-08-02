const Socket = require('./Socket')

async function start(){
   
   const bot = new Socket({
      path: 'Socket/Sesion',
      phone: '',
      prefix: '/'
   })
   
   console.log(bot)
}

start()