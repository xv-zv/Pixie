const { Socket } = require('./Socket')
const Utils = require('./Utils')

Object.assign(global,{
   origen: __dirname
})

async function start() {
   
   const load = (new Utils.Load()).start()
   Object.assign(global, load.files)
   
   const bot = new Socket({
      path: 'Socket/Sesion',
      phone: '',
      prefix: '/'
   })
   
   bot.ev.on('code', code => {
      console.log('code: '+ code)
   })
   bot.ev.on('status', status => {
      console.log('status: '+ status)
   })
   
   bot.ev.on('text', (...args) => {
      for (const other of others) {
         other(...args, bot)
      }
   })
   
   bot.start()
}

start()