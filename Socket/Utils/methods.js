const {
   isJidGroup
} = require('@whiskeysockets/baileys')

class Methods {
   online
   #sock
   constructor(sock) {
      this.#sock = sock
      this.online = false
      this.wsOnline = this.#sock.ws.socket._readyState === 1
   }
   
   close = (all) => {
      if (!this.#sock) return
      this.#sock.ws.close()
      this.online = false
   }
   
   getMetadata = async id => {
      if (!id || !isJidGroup(id)) return {}
      
      const data = await this.#sock.groupMetadata(id)
      const admins = data.participants.filter(i => i.admin !== null).map(i => i.id)
      const users = data.participants.map(i => i.id)
      
      return {
         id: data.id,
         name: data.subject,
         owner: data.owner,
         size: data.size,
         creation: data.creation,
         open: !data.announce,
         isComm: data.isCommunity,
         admins,
         users,
         desc: data.desc
      }
   }
}

module.exports = { Methods }