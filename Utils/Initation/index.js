const path = require('path')
const request = require('readline-sync').question

const Initation = async () => {
   
   let phone, prefix
   
   const ruta = path.join(origen, core['path'], 'creds.json')
   
   const newLogin = F.exJsnSync(ruta) ? !(F.rdJsnSync(ruta))?.registered : true
   
   console.log(`
       /\\_/\\      ɪɴɪᴄɪᴀɴᴅᴏ ᴇʟ ᴄʜᴀᴛʙᴏᴛ   
      (• . •)          
       (___)~         Vy - Team | Svn 
        `)
   
   console.log(newLogin ? 'Vamos a crear un bot de whatsapp' : 'Conectando con WhatsApp')
   
   if (newLogin) {
      
      if (F.exFileSync(core['path'])) F.rmFileSync(core['path'])
      
      phone = request('Digita el Numero: ').replace(/\D/g, '')
      
      if (!phone || phone.length < 8) {
         console.log('Not Found Number')
         process.exit()
      }
      
      prefix = request('Prefijo: ')
      
      if (!prefix) {
         console.log('Not Found Prefix')
         process.exit()
      }
   }
   
   return { newLogin, phone, prefix }
}

module.exports = { Initation }