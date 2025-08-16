module.exports = {
   cmd: 'transmitir',
   async func(m, bot) {
      
      const n = m.isQuote ? m.quote : m
      
      if (!n.quote && !n.media && !n.text) {
         return m.react('❌')
      }
      
      const content = n.isMedia ? {
         [n.type]: await n.media(), caption: n.text || m.text, mimetype: n.mime } : { text: n.text || m.text }
      
      await m.react('⌛')
      
      const groups = await bot.fetchAllGroups()
      
      for (const { id, ...data } of groups) {
         if(!data.open && !data.admins.incl)
      }
   }
}