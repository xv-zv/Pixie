const Events = require('./Utils/class.js')

class SocketEmiter {
   constructor(args) {
      this.args = {
         path: args.path || 'Sesion',
         phone: args.phone.replace(/\D/g,''),
         prefix: Array.isArray(args.prefix) ? args.prefix : [args.prefix || '/']
      }
   }
   
   sendMessage = (id, content, opc = {}) => {
      return this.sock.sendMessage(id, {
         ...content,
         viewOnce: Boolean(opc.once),
         contextInfo: {
            expiration: opc.expiration || 0,
            mentions: opc.mentions || []
         }
      }, { quoted: opc.quoted || null })
   }
}

Object.defineProperties(SocketEmiter.prototype, {
   sock: { value: null, writable: true },
   ev: { value: new Events() },
})

module.exports = SocketEmiter