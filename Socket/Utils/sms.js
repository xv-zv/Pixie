const {
   jidNormalizedUser,
   getContentType,
   isLidUser,
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
   m.isGroup = isJidGroup(m.from)
   
   m.isBot = ctx.key.fromMe && dv() == 'web'
   m.isMe = ctx.key.fromMe && !m.isBot
   const user = ctx.key.participant || m.from
   m.isUser = !m.isBot || !m.isMe
   m.isLid = isLidUser(user)
   
   m.chat = jidNormalizedUser(m.isGroup ? user : !m.isUser ? (m.isLid ? bot.lid : bot.id) : user)
   
   return m
}