const {
   jidNormalizedUser,
   getContentType,
   isLidUser,
   getDevice,
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
   const isBot = ctx.key.fromMe && dv() == 'web'
   const isMe = ctx.key.fromMe && !isBot
   const user = ctx.key.participant || m.from
   const isUser = !isBot && !isMe
   const isLid = isLidUser(user)
   
   m.chat = jidNormalizedUser(isGroup ? user : !isUser ? (isLid ? bot.lid : bot.id) : user)
   
   m = {
      ...m,
      ...(isGroup && { isGroup }),
      ...(isUser && { isUser }),
      ...(isBot && { isBot }),
      ...(isMe && { isMe })
   }
   
   const type = getContentType(ctx.message)
   const msg = ctx.message[type]
   const body = (typeof msg === 'string') ? msg : msg.caption || msg.text || ''
   
   if (body) {
      
      const isCmd = body.startsWith('/')
      m.text = body
      
      if (isCmd) {
         
         const [cmd, ...args] = body.slice(1).trim().split(/ +/)
         const text = args.join(' ')
         
         m = {
            ...m,
            prefix: '/',
            ...(cmd && { command: cmd }),
            ...(text && { text })
         }
      }
   }
   return m
}