module.exports = {
   cmd: 'transmitir',
   async func(m , bot){
      
      const n = m.isQuote ? m.quote : m 
      
      const content = n.isMedia ? { [n.type]: await n.media() , caption: n.text || m.text , mimetype: n.mime } : { text: n.text || m.text }
      
      
   }
}