const { Socket } = require('./Socket')
const Utils = require('./Utils')

async function start() {
   
   const load = (new Utils.Load()).start()
   Object.assign(global, load.files)
   
   const bot = new Socket({
      path: 'Socket/Sesion',
      phone: '',
      prefix: '/'
   })
   
   bot.ev.on('code', console.log)
   bot.ev.on('status', console.log)
   
   bot.ev.on('text', (...args) => {
      for (const other of others) {
         other(...args, bot)
      }
   })
   
   bot.start()
   console.log(bot)
}

start()