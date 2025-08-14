const {
   isJidGroup
} = require('@whiskeysockets/baileys')
const {
   fileTypeFromStream,
   fileTypeFromBuffer
} = require('file-type')
const long = require('long').fromNumber
const fs = require('fs-extra')

const nmMedia = url => Buffer.isBuffer(url) ? url : { url }
const nmDesc = txt => typeof txt == 'string' ? txt : txt.desc

class Methods {
   #sock
   constructor(sock) {
      this.#sock = sock
   }
   
   get online() {
      return this.#sock.ws.socket?._readyState == 1
   }
   
   close = () => {
      this.#sock.ev.removeAllListeners()
      this.#sock.ws.close()
   }
   
   sendMessage = (id, content, opc = {}) => {
      if (!this.online) return
      return this.#sock.sendMessage(id, {
         ...content,
         contextInfo: {
            expiration: opc.expiration || 0,
            mentionedJid: opc.mentions || []
         }
      }, { quoted: opc.quoted })
   }
   
   sendImage = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         image: nmMedia(content),
         caption: nmDesc(opc),
         mimetype: opc.mime || 'image/jpeg',
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendVideo = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         video: nmMedia(content),
         caption: nmDesc(opc),
         mimetype: opc.mime || 'video/mp4',
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendAudio = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         audio: nmMedia(content),
         mimetype: opc.mime || 'audio/mpeg',
         ptt: Boolean(opc.note),
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendFile = async (id, media, opc = {}) => {
      const { ext, mime } = await this.getFileType(media)
      return this.sendMessage(id, {
         document: nmMedia(media),
         caption: nmDesc(opc),
         fileName: (opc.name || mime.split('/')[0]) + '.' + ext,
         mimetype: mime,
         fileLength: opc.size ? long(Number(opc.size) * 1000000, true) : null
      }, opc)
   }
   
   getMetadata = async id => {
      
      if (!this.online || !isJidGroup(id)) return
      
      const data = await this.#sock.groupMetadata(id)
      const admins = data.participants.filter(i => i.admin !== null).map(i => i.id)
      const users = data.participants.map(i => i.id)
      
      return {
         id: data.id,
         name: data.subject,
         owner: data.owner,
         size: data.size,
         creation: data.creation,
         open: !data.announce,
         isComm: data.isCommunity,
         admins,
         users,
         desc: data.desc
      }
   }
   
   getFileType = async input => {
      if(!this.online) return
      const isUrl = /https?:\/\/[^\s"'`]+/.test(input)
      const isBuffer = Buffer.isBuffer(input)
      const isPath = /[\w\d./-]\.\w{2,4}/.test(input)
      if (isUrl) {
         const res = await fetch(input)
         return fileTypeFromStream(res.body)
      }
      if (isBuffer) return fileTypeFromBuffer(input)
      if (isPath) {
         const buffer = await fs.readFile(input)
         return fileTypeFromBuffer(buffer)
      }
   }
}

module.exports = { Methods }