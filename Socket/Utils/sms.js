const {
   jidNormalizedUser,
   getContentType,
   isLidUser,
   isJidStatusBroadcast,
   getDevice,
   downloadMediaMessage,
   isJidGroup
} = require('@whiskeysockets/baileys')

exports.sms = async (sock, ctx, q) => {
   
   let m = {}
   const dv = () => getDevice(ctx.key.id)
   const bot = {
      id: jidNormalizedUser(sock.user?.id),
      lid: jidNormalizedUser(sock.user?.lid),
      name: sock.user?.name || 'annonymous'
   }
   
   m.from = ctx.key.remoteJid
   
   const isGroup = isJidGroup(m.from)
   const isBc = isJidStatusBroadcast(m.from)
   const isBot = ctx.key.fromMe && dv() == 'web'
   const isMe = ctx.key.fromMe && !isBot
   const user = ctx.key.participant || m.from
   const isUser = !isBot && !isMe
   const isLid = isLidUser(user)
   
   m.sender = jidNormalizedUser(isGroup ? user : !isUser ? (isLid ? bot.lid : bot.id) : user)
   
   m = {
      ...m,
      ...(ctx.pushName && { name: ctx.pushName }),
      ...(isUser && { isUser }),
      ...(isBot && { isBot }),
      ...(isMe && { isMe }),
      ...(isBc && { isBc })
   }
   
   const type = getContentType(ctx.message)
   const msg = ctx.message[type]
   const body = (typeof msg === 'string') ? msg : msg.caption || msg.text || ''
   
   if (body) {
      
      const isCmd = body.startsWith('/')
      
      if (isCmd && !q) {
         
         const [cmd, ...args] = body.slice(1).trim().split(/ +/)
         const text = args.join(' ')
         
         m = {
            ...m,
            prefix: '/',
            ...(cmd && { command: cmd }),
            ...(text && { text })
         }
      } else {
         m = {
            ...m,
            ...(body && { text: body })
         }
      }
   }
   
   if (typeof msg !== 'string') {
      
      const isMedia = ('mimetype' in msg)
      
      if (isMedia) {
         
         const media = () => downloadMediaMessage(ctx, 'buffer')
         
         m = {
            ...m,
            isMedia,
            type: type.replace('Message', ''),
            mime: msg.mimetype,
            ...(msg.isAnimated && { isAnimated: true }),
            ...(msg.seconds && { duration: msg.seconds }),
            media
         }
      }
      
      const info = msg.contextInfo
      
      if (info) {
         
         m = {
            ...m,
            ...(info.mentionedJid.length > 0 && { mentions: info.mentionedJid }),
            ...(info.expiration && { ephemeral: info.expiration })
         }
         
         const quoted = info.quotedMessage
         
         if (quoted) {
            
            const quote = {
               key: {
                  remoteJid: info.remoteJid || m.from,
                  participant: info.participant,
                  id: info.stanzaId,
                  fromMe: Object.values(bot).includes(info.participant)
               },
               message: quoted
            }
            
            m.quote = await exports.sms(sock, quote, true)
         }
      }
   }
   
   if (!q) {
      
      if (isGroup) {
         
         const data = await sock.getMetadata(m.from)
         
         if (data) {
            
            const isAdmin = data.admins.includes(m.sender)
            const isBotAdmin = data.admins.includes(isLid ? bot.lid : bot.id)
            
            m = {
               ...m,
               isGroup: true,
               ...(isAdmin && { isSenderAdmin: true }),
               ...(isBotAdmin && { isBotAdmin })
            }
            
            m.group = () => data
         }
      }
      
      reply = (text, opc = {}) => sock.sendMessage(opc.id || from, { text }, { ephemeral: m.ephemeral || 0, quoted: ctx, ...opc })
   }
   
   return m
}