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
   
   const owners = sock.args.owners || []
   
   let m = {}
   const dv = () => getDevice(ctx.key.id)
   
   m.from = ctx.key.remoteJid
   
   const isGroup = isJidGroup(m.from)
   const isBc = isJidStatusBroadcast(m.from)
   const isBot = ctx.key.fromMe && dv() == 'web'
   const isMe = ctx.key.fromMe && !isBot
   const user = ctx.key.participant || m.from
   const isUser = !isBot && !isMe
   const isLid = isLidUser(user)

   m.user = jidNormalizedUser(isGroup ? user : !isUser ? (isLid ? sock.user.lid : sock.user.id) : user)
   
   const isOwner = owners.some(i => m.user.includes(i))
   
   m = {
      ...m,
      ...(ctx.pushName && { name: ctx.pushName }),
      ...(isUser && { isUser }),
      ...(isBot && { isBot }),
      ...(isOwner && { isOwner }),
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
            isCmd,
            prefix: '/',
            ...(cmd && { cmd }),
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
            ...(info.mentionedJid?.length > 0 && { mentions: info.mentionedJid }),
            ...(info.expiration && { ephemeral: info.expiration })
         }
         
         const quoted = info.quotedMessage
         
         if (quoted) {
            
            const quote = {
               key: {
                  remoteJid: info.remoteJid || m.from,
                  participant: info.participant,
                  id: info.stanzaId,
                  fromMe: Object.values(sock.user).includes(info.participant)
               },
               message: quoted
            }
            m.isQuote = true
            m.quote = await exports.sms(sock, quote, true)
         }
      }
   }
   
   if (!q) {
      
      if (isGroup) {
         
         const data = await sock.getMetadata(m.from)
         
         if (data) {
            
            const isAdmin = data.admins.includes(m.user)
            const isBotAdmin = data.admins.includes(isLid ? sock.user.lid : sock.user.id)
            
            m = {
               ...m,
               isGroup: true,
               ...(isAdmin && { isUserAdmin: true }),
               ...(isBotAdmin && { isBotAdmin }),
               ...(isOwner && isAdmin && { isOwnerAdmin: true })
            }
            
            m.group = () => data
         }
      }
      
      m.react = text => sock.sendMessage(m.from, { react: { text, key: ctx.key } })
      
      m.reply = (text, opc = {}) => sock.sendMessage(opc.id || m.from, { text }, { ephemeral: m.ephemeral || 0, quoted: ctx, ...opc })
   }
   
   return m
}