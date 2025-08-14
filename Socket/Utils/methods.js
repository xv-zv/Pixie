const {
   isJidGroup
} = require('@whiskeysockets/baileys')

class Methods {
   #sock
   constructor(sock) {
      this.#sock = sock
      this.online = false
   }
   
   close = () => {
      if (!this.#sock) return
      if (this.online) this.#sock.ws.close()
      this.online = false
      this.#sock = null
   }
   
   getMetadata = async id => {
      if (!id || !isJidGroup(id)) return {}
      
      const data = await this.#sock.groupMetadata(id)
      const admins = data.participants.filter(i => i.admin !== null).map(i => i.id)
      const users = data.participants.map(i => id)
      
      return {
         id: data.id,
         name: data.subject,
         owner: data.owner,
         size: data.size,
         creation: data.creation,
         open: data.announce,
         isComm: data.isCommunity,
         admins,
         users,
         desc
      }
   }
}

module.exports = { Methods }