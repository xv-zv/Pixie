const { Events  } = require('./Utils/class.js')

class SocketEmiter {
   
   constructor(args = {}) {
      this.args = {
         path: args.path || 'Sesion',
         phone: args.phone?.replace(/\D/g,''),
         prefix: Array.isArray(args.prefix) ? args.prefix : [args.prefix || '/'],
         ...(args.newLogin && { newLogin: true })
      }
      this.online = false
   }
   
   sendMessage = (id, content, opc = {}) => {
      if(!this.online) return
      return this.sock.sendMessage(id, {
         ...content,
         viewOnce: Boolean(opc.once),
         contextInfo: {
            expiration: opc.expiration || 0,
            mentionedJid: opc.tags || []
         }
      }, { quoted: opc.quoted || null })
   }
}

Object.defineProperties(SocketEmiter.prototype, {
   sock: { value: null, writable: true },
   ev: { value: new Events() },
   getMsg: { value: null , writable: true },
   user: {
      get(){
         const user = this.sock?.user || {}
         return {
            id: user.id?.replace(/:\d+/,'') || null,
            lid: user.lid?.replace(/:\d+/,'') || null,
            name: user.name || 'annonymous',
            prefix: this.args.prefix
         }
      }
   }
})

module.exports = SocketEmiter