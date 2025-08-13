const { jidNormalizedUser } = require('@whiskeysockets/baileys')

class Methods {
   #sock
   constructor(sock){
      this.#sock = sock
      this.online = false
   }
   
   get user (){
      const user = this.#sock?.user || {}
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous'
      }
   }

   close = () => {
      if (!this.#sock) return
      if (this.online) this.#sock.ws.close()
      this.online = false
      this.#sock = null
   }
   
}

module.exports = { Methods }