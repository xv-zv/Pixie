const Socket = require('./Socket');
const Utils = require('./Utils');
const PATH = require('path');
const { format } = require('util');
const fs = require('fs');

Object.assign(global, {
   origen: __dirname,
   core: JSON.parse(fs.readFileSync('./Socket/config.json')),
   f: Utils.funcs
})

const load = new Utils.Load(PATH.join(origen, 'Message'))
const { cmds = {} } = load.load(load.folder)

const owners = core.owners.reduce((_, i) => [i.id, i.lid].filter(Boolean), [])

async function start() {
   
   const bot = new Socket({
      path: './Sesion',
      phone: '527203011517',
      owners
   })
   
   bot.on('code', console.log)
   bot.on('status', console.log)
   
   Object.keys(cmds).forEach(name => {
      bot.cmd(name, (m, msg) => {
         const cmd = cmds[name]
         if (cmd.isOwner && !m.isOwner) return
         if (cmd.isGroup && !m.isGroup) return
         if (cmd.isAdmin && (!m.isUserAdmin && !m.isBotAdmin)) return
         cmd(m, bot, msg)
      })
   })
   
   const events = [
   {
      event: 'text',
      func: async (m, msg) => {
         if (/^[_>]/.test(m.text) && m.isOwner) {
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