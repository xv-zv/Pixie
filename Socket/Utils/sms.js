const {
   jidNormalizedUser,
   getContentType,
   isJidGroup
} = require('@whiskeysockets/baileys')

exports.sms = async (sock, ctx, m = {}) => {
   
   m = {
      from: ctx.key.remoteJid,
      chat: jidNormalizedUser(ctx.key.participant || m.from),
      isGroup: isJidGroup(m.from)
   }
   
   return m
}