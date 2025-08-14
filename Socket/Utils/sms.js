const {
   jidNormalizedUser,
   getContentType,
   isLidUser,
   isJidStatusBroadcast,
   getDevice,
   downloadMediaMessage,
   isJidGroup
} = require('@whiskeysockets/baileys')

exports.sms = async (sock, ctx, m = {}) => {
   
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
      
      if (isCmd) {
         
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
            ...(msg.duration && { duration: msg.duration }),
            media
         }
      }
      
      const info = msg.contextInfo
      
      if (info) {
         
         m = {
            ...m,
            ...(info.mentionedJid.length > 0 && { mentions: info.mentionedJid }),
            ...(info.expiration && { expiration: info.expiration })
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
            
            m.quote = await exports.sms(sock, quote)
         }
      }
      
      if (isGroup) {
         
         const data = await sock.groupMetadata(m.from)
         const users = data.participants.map(i => i.id)
         const admins = data.participants.filter(i => i.admin !== null).map(i => i.id)
         const isAdmin = admins.includes(m.sender)
         const isBotAdmin = admins.includes(isLid ? bot.lid : bot.id)
         const exp = data.ephemeralDuration
         
         m.isGroup = true
         m.group = {
            id: m.from,
            name: data.subject,
            open: data.announce,
            size: data.size,
            owner: data.owner,
            ...(exp && { expiration: exp }),
            isSenderAdmin: isAdmin,
            isBotAdmin,
            isCommunity: data.isCommunity,
            admins,
            users,
            desc: data.desc
         }
      }
   }
   
   return m
}