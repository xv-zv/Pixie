const {
   getContentType,
   downloadContentFromMessage
} = require('@whiskeysockets/baileys');
 
class Message {
   #sock = {}
   #args = {}
   constructor(sock, args) {
      this.#sock = sock
      this.#args = args
   }
   
   getFrom = (key, status, m = {}) => {
      
      m.from = key.remoteJid
      m.sender = m.key.participant
      m.isGroup = from.endsWith('@g.us')
      m.isBot = key.fromMe && status == 1
      m.isMe = key.fromMe && status == 2
      
      if (!m.sender && !m.isGroup && (m.isBot || m.isMe)) m.sender = bot.id
      return m
   }
   
   getMsg = (message , m = {}) => {
      
   }
   
   getCtx = (message) => {
   
      const msgType = getContentType(message)
      
      const getMsg = (content, type) => {
         
         const body = type == 'conversation' ? msg : type == 'extendedTextMessage' ? msg.text : ['video', 'image', 'document'].some(i => type.startsWith(i)) ? msg.caption : ''
         
         const isMedia = Boolean(msg.mimetype)
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


module.exports = { Events }