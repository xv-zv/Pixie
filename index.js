const Socket = require('./Socket');
const Utils = require('./Utils');
const PATH = require('path');
const { format } = require('util');

Object.assign(global, {
   origen: __dirname
})

const load = new Utils.Load(PATH.join(origen, 'Message'))
load.load(load.folder)
const { cmds, others } = load.files

async function start() {
   
   const bot = new Socket({
      path: './Sesion',
      phone: '527203011517'
   })
   
   bot.on('code', console.log)
   bot.on('status', console.log)
   
   Object.keys(cmds).forEach(name => {
      bot.cmd(name, (m, msg) => {
         const cmd = cmds[name]
         cmd(m, bot, msg)
      })
   })
   
   const events = [
   {
      event: 'text',
      func: async (m, msg) => {
         if (/^[_>]/.test(m.text)) {
            const exec = /await|return/.test(m.text) ? `(async() => { ${m.text.slice(1)}})()` : m.text.slice(1)
            let text = null
            try {
               text = await eval(exec)
            } catch (e) {
               text = e.message
            }
            m.reply(format(text))
         }
      }
   },
   {
      event: 'media',
      func: (m, msg) => {}
   }]
   
   events.forEach(({ event, func }) => {
      bot.on(event, func)
   })
   
   bot.start()
}

start()