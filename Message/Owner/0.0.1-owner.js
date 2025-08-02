const { format } = require('util')

module.exports = {
   async func(m, msg, bot) {
      if (m.body.text.startsWith('>')) {
         
      const text = /await|return/.test(m.body.text) ? `(async() => { ${m.body.text.slice(1)} })()` : m.body.text.slice(1)
      
         let result
         try {
            result = await eval(text)
         } catch (e) {
            result = "Error: " + e.message
         }
         
         bot.sendMessage(m.from.id, {
            text: format(result)
         }, { quoted: msg , expiration: m.body.exp || 0 })
         
      }
   }
}