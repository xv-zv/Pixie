

class Methods {
   #sock
   constructor(sock){
      this.#sock = sock
      this.online = false
   }

   close = () => {
      if (!this.#sock) return
      if (this.online) this.#sock.ws.close()
      this.online = false
      this.#sock = null
   }
   
}

module.exports = { Methods }