const {
   jidNormalizedUser,
   getContentType,
   isRealMessage,
   isJidGroup
} = require('@whiskeysockets/baileys')

exports.sms = async (sock, ctx, m = {}) => {
   m.id = ctx.key.id
   if (!isRealMessage(ctx, m.id)) return
   
   m = {
      ...m,
      from: ctx.key.remoteJid,
      chat: jidNormalizedUser(ctx.key.participant || m.from),
      isGroup: isJidGroup(m.from)
   }
   return m
}