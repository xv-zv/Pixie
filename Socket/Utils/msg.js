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
         ...(msg.duration && { duration: msg.duration }),
         ...(msg.isAnimated && { isAnimated: true })
      })
   }
   
   getMsg = (content, m = {}) => {
      m.type = getContentType(content)
      const msg = content[m.type] || {}
      const ctx = msg.contextInfo || {}
      m.body = msg.text || msg.caption || (typeof msg == 'string' ? msg : '')
      m.isMedia = Boolean(msg.mimetype)
      m.tags = ctx.mentionedJid?.length > 0 ? ctx.mentionedJid : null
      m.sender = ctx.participant || null
      m.id = ctx.stanzaId || null
      m.exp = ctx.expiration || null
      m.isQuote = Boolean(ctx.quotedMessage)
      m.quote = ctx.quotedMessage || null
      return m
   }
   
   build() {
      
      let quote = null
      
      return ({ key, message, ...content }) => {
         
         const isGroup = key.remoteJid.endsWith('@g.us')
         const isUser = !key.fromMe && (Boolean(key.participant) || !('status' in content))
         const isMe = !isUser && content.status == 2 && (content.pushName == this.sock.user.name)
         const isBot = !isUser && content.status == 1
         
         const from = {
            id: jidNormalizedUser(key.remoteJid),
            sender: jidNormalizedUser(isGroup ? key.participant : (isMe || isBot) ? this.sock.user.id : key.remoteJid),
            name: content.pushName,
            ...(isGroup && { isGroup }),
            ...(isBot && { isBot }),
            ...(isMe && { isMe }),
            ...(isUser && { isUser }),
            ...(content.broadcast && { isBc: true })
         }
         
         const msg = this.getMsg(message)
         let body = {
            ...(key.id && { id: key.id }),
            ...(msg.tags && { tags: msg.tags }),
            ...(msg.body && { text: msg.body }),
            ...(msg.exp && { exp: msg.exp }),
            ...(msg.isMedia && { isMedia: true }),
         }
         
         if (msg.body) {
            
            const isCmd = this.sock.user.prefix.some(i => msg.body.startsWith(i))
            
            if (isCmd) {
               const [cmd, ...args] = msg.body.slice(1).trim().split(/ +/)
               body = {
                  ...body,
                  isCmd: true,
                  ...(cmd && { cmd }),
                  ...(args && { text: args.join(' ').trim() })
               }
            }
         }
         
         const media = msg.isMedia ? this.getMedia(message[msg.type], msg.type) : null
         
         if (msg.isQuote) {
            const msgQuote = this.getMsg(msg.quote)
            const mediaQuote = msgQuote.isMedia ? this.getMedia(msg.quote[msgQuote.type], msgQuote.type) : null
            quote = {
               ...(msg.sender && { sender: msg.sender }),
               ...(msg.id && { id: msg.id }),
               ...(msgQuote.tags && { tags: msgQuote.tags }),
               ...(msgQuote.body && { text: msgQuote.body }),
               ...(msgQuote.isMedia && { isMedia: true }),
               ...(media && { media })
            }
         }
         
         return {
            message: { key, message, ...content },
            data: {
               ...(from && { from }),
               ...(body && { body }),
               ...(media && { media }),
               ...(quote && { quote })
            }
         }
      }
   }
}
module.exports = { Message }