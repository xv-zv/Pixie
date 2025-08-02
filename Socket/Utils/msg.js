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
      
      const mediaType = type.replace('Message', '')
      const download = async () => {
         const stream = await downloadContentFromMessage(msg, mediaType);
         const buffer = [];
         for await (const chunk of stream) buffer.push(chunk);
         return Buffer.concat(buffer);
      };
      
      return Object.assign(download, {
         mediaType,
         mime: msg.mimetype,
         duration: msg.duration || null,
         isAnimated: msg.isAnimated || false
      })
   }
   
   getMsg = (content, m = {}) => {
      m.type = getContentType(content)
      const msg = content[m.type] || {}
      const ctx = msg.contextInfo || {}
      m.body = msg.text || msg.caption || (typeof msg == 'string' ? msg : '')
      m.isMedia = Boolean(msg.mimetype)
      m.tags = ctx.mentionedJid || []
      m.exp = ctx.expiration || 0
      m.isQuote = Boolean(ctx.quotedMessage)
      m.quote = ctx.quotedMessage || {}
      return m
   }
   
   build() {
      
      let quote = {}
      
      return ({ key, message, ...content }) => {
         
         const isGroup = key.remoteJid.endsWith('@g.us')
         const isUser = !key.fromMe && Boolean(key.participant) && !content.status
         const isMe = !isUser && content.status == 2 && (content.pushName == this.sock.bot.name)
         const isBot = !isUser && content.status == 1
         const from = {
            id: jidNormalizedUser(key.remoteJid),
            sender: jidNormalizedUser(isGroup ? key.participant : (isMe || isBot) ? this.sock.user.id : key.remoteJid),
            name: content.pushName,
            isGroup,
            isBot,
            isMe,
            isUser
         }
         
         const msg = this.getMsg(message)
         const body = {
            tags: msg.tags,
            exp: msg.exp,
            isMedia: msg.isMedia
         }
         
         if (msg.body) {
            
            body.text = msg.body
            body.isCmd = this.sock.bot.prefix.some(i => msg.body.startsWith(i))
            if (body.isCmd) {
               const [cmd, ...args] = msg.body.slice(1).trim().split(/ +/)
               body.cmd = cmd
               body.text = args.join(' ')
            }
         }
         
         const media = msg.isMedia ? this.getMedia(message[msg.type], msg.type) : null
         
         if (msg.isQuote) {
            const msgQuote = this.getMsg(msg.quote)
            const mediaQuote = msgQuote.isMedia ? this.getMedia(msg.quote[msgQuote.type], msgQuote.type) : null
            quote = {
               tags: msgQuote.tags,
               text: msgQuote.body,
               isMedia: msgQuote.isMedia,
               media: mediaQuote
            }
         }
         return { from, body, media , quote }
      }
   }
}

module.exports = { Message }