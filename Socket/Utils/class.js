const {
   getContentType,
   downloadContentFromMessage
} = require('@whiskeysockets/baileys');

class Message {
   constructor(bot) {
      this.bot = bot
      this.sock = bot.sock
      return this.build()
   }
   
   build() {
      return (message) => {
         console.log(this,message)
      }
   }
}

class Events {
   
   constructor() {
      this.events = {}
      this.commands = {}
   }
   
   on = (event, listner) => {
      if (!this.#isListner(listner)) return
      if (!this.events[event]) this.events[event] = []
      this.events[event].push(listner)
   }
   
   command = (cmd, listner) => {
      if (!this.#isListner(listner)) return
      if (!this.commands[cmd]) this.commands[cmd] = []
      this.commands[cmd].push(listner)
   }
   
   emit = (event, ...args) => {
      if (!this.events[event]) return
      this.events[event].forEach(f => f(...args))
   }
   
   emitCmd = (cmd, ...args) => {
      if (!this.commands[cmd]) return
      this.commands[cmd].forEach(f => f(...args))
   }
   
   off = (event, ...args) => {
      this.emit(event, ...args)
      delete this.events[event]
   }
   
   #isListner = listner => typeof listner == 'function'
}


module.exports = { Events , Message }