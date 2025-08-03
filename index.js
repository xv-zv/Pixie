const { Socket } = require('./Socket')
const Utils = require('./Utils')

const load = new Utils.Load()
load.start()

//global assign
global.F =  Utils.Funcs()
Object.assign(global,{
   origen: __dirname,
   core: F.rdJsnSync('./Socket/config.json'),
   ...load.files
})

async function start() {
   
   const args = await Utils.Initation()
   
   const bot = new Socket({
      path: core.path,
      ...args
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