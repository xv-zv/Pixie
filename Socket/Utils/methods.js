const {
   isJidGroup,
   jidNormalizedUser
} = require('@whiskeysockets/baileys')

const {
   fileTypeFromStream,
   fileTypeFromBuffer
} = require('file-type')
const long = require('long').fromNumber
const fs = require('fs-extra')
const normalize = require('./normalize.js')

class Methods {
   #sock
   constructor(sock) {
      this.#sock = sock
      this.user = this.bot
   }
   
   get online() {
      return this.#sock.ws.socket?._readyState == 1
   }
   
   get bot() {
      const user = this.#sock?.user || {}
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous'
      }
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
            expiration: opc.ephemeral || 0,
            mentionedJid: opc.mentions || []
         }
      }, { quoted: opc.quoted })
   }
   
   sendImage = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         image: normalize.media(content),
         caption: normalize.desc(opc),
         mimetype: opc.mime || 'image/jpeg',
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendVideo = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         video: normalize.media(content),
         caption: normalize.desc(opc),
         mimetype: opc.mime || 'video/mp4',
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendAudio = (id, content, opc = {}) => {
      return this.sendMessage(id, {
         audio: normalize.media(content),
         mimetype: opc.mime || 'audio/mpeg',
         ptt: Boolean(opc.note),
         viewOnce: Boolean(opc.once)
      }, opc)
   }
   
   sendFile = async (id, media, opc = {}) => {
      const { ext, mime } = await this.getFileType(media)
      return this.sendMessage(id, {
         document: normalize.media(media),
         caption: normalize.desc(opc),
         fileName: (opc.name || mime.split('/')[0]) + '.' + ext,
         mimetype: mime,
         fileLength: opc.size ? long(Number(opc.size) * 1000000, true) : null
      }, opc)
   }
   
   getMetadata = async id => {
      if (!this.online || !isJidGroup(id)) return
      
      const data = await this.#sock.groupMetadata(id)
      return normalize.group(data)
   }
   
   fetchAllGroups = async () => {
      try {
         const groups = Object.values(await this.#sock.groupFetchAllParticipating()).filter(i => !i.isCommunity)
         return groups.map(data => normalize.group(data))
      } catch (e) {
         return []
      }
   }
   
   groupUpdate = (id, content, action) => {
      if (!this.online || !id) return
      action ??= content
      
      if (/^(open|close)$/.test(action)) {
         return this.#sock.groupSettingUpdate(id, (action == 'open' ? 'not_' : '') + 'announcement')
      }
      
      if (action) {
         if (/^(name|desc)$/.test(action)) {
            return this.#sock['groupUpdate' + (action == 'name' ? 'Subject' : 'Description')](id, content)
         }
         
         if (/^(add|remove|(pro|de)mote)$/.test(action)) {
            return this.#sock.groupParticipantsUpdate(id, Array.isArray(content) ? content : [content], action)
         }
      }
   }
   
   getFileType = async input => {
      if (!this.online) return
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