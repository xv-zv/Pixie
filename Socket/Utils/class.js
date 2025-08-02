const {
   getContentType,
   downloadContentFromMessage,
   jidNormalizedUser
} = require('@whiskeysockets/baileys');

class Message {
   constructor(sock) {
      this.sock = sock
      return this.build()
   }
   
   getMedia = (msg, type, m = {}) => {
      
      m.type = type.replace('Message', '')
      m.mime = msg.mimetype
      
      const isAnimated = Boolean(msg.isAnimated)
      
      if (isAnimated) m.isAnimated = isAnimated
      if (msg.duration) m.duration = msg.duration
      
      const download = async () => {
         const stream = await downloadContentFromMessage(msg, m.type)
         const buffer = []
         for await (const chunk of stream) {
            buffer.push(chunk)
         }
         return Buffer.concat(buffer)
      }
      
      return Object.assign(download, m)
   }
   
   build() {
      const from = {}
      const body = {}
      return (message) => {
         const {
            remoteJid,
            participant,
            fromMe,
            id
         } = message.key || {}
         const isUser = !fromMe && Boolean(participant) && !Boolean(message.status)
         const isMe = !isUser && (message.status == 2 || message.pushName == this.sock.bot.name )
         const isBot = !isUser && message.status == 1
         const isGroup = remoteJid.endsWith('@g.us')
         
         from.id = jidNormalizedUser(remoteJid)
         from.sender = jidNormalizedUser(isGroup ? participant : (isMe || isBot) ? this.sock.bot.id : remoteJid)
         from.name = message.pushName
         
         return { from }
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


module.exports = { Events, Message }