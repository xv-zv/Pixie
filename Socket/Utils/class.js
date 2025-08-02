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
   
   getMsg = (content, m = {}) => {
      m.type = getContentType(content)
      const msg = content[m.type] || {}
      m.body = msg.text || msg.caption || typeof msg == 'string' ? msg : ''
      m.isMedia = Boolean(msg.mimetype)
      const ctx = msg.contextInfo || {}
      m.tags = ctx.mentionedJid || []
      m.exp = ctx.expiration || 0
      m.isQuote = Boolean(ctx.quotedMessage)
      m.quote = ctx.quotedMessage || {}
      return m
   }
   
   build() {
      const from = {}
      const body = {}
      const quote = {}
      const media = {}
      const ctx = {}
      
      return ({ key, message, ...content }) => {
         
         ctx.isUser = !key.fromMe && Boolean(key.participant) && !Boolean(content.status)
         ctx.isMe = !ctx.isUser && (content.status == 2 || content.pushName == this.sock.bot.name)
         ctx.isBot = !ctx.isUser && content.status == 1
         ctx.isGroup = key.remoteJid.endsWith('@g.us')
         
         from.id = jidNormalizedUser(key.remoteJid)
         from.sender = jidNormalizedUser(ctx.isGroup ? key.participant : (ctx.isMe || ctx.isBot) ? this.sock.bot.id : key.remoteJid)
         from.name = content.pushName
         
         const msg = this.getBody(message)
         ctx.isMedia = msg.isMedia
         ctx.isQuote = msg.isQuote
         
         if (msg.body) {
            body.text = msg.body
            ctx.isCmd = this.sock.bot.prefix.some(i => msg.body.startsWith(i))
            if (ctx.isCmd) {
               const [cmd, args] = msg.body.slice(1).trim().split(/ +/)
               body.cmd = cmd
               body.text = args.join(' ')
            }
         }
         
         return { from, body, ctx }
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