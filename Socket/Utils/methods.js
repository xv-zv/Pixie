const Events = require('./events.js');

class Methods extends Events {
   constructor(){
      this.sock = null
      this.online = false
   }
   
   close = () => {
      if(!this.sock) return 
      if(this.online) this.sock.ws.close()
      this.online = false
      this.sock = null
   }
   
}

module.exports = { Methods }