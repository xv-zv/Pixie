const {
   makeCacheableSignalKeyStore,
   makeWASocket,
   DisconnectReason,
   isRealMessage,
   Browsers,
   useMultiFileAuthState
} = require('@whiskeysockets/baileys');

const { Events, ...Utils } = require('./Utils');
const fs = require('fs-extra');
const pino = require('pino');

class Socket extends Events {
   args
   constructor(args) {
      super()
      this.args = args
   }
   
   start = async () => {
      
      const logger = pino({ level: 'silent' })
      const { state, saveCreds } = await useMultiFileAuthState(this.args.path)
      
      const sock = await makeWASocket({
         logger,
         auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
         },
         browser: Browsers.ubuntu('Chrome')
      })
      Object.assign(this, (new Utils.Methods(sock)))
      this.#listEvents(sock, saveCreds).forEach(i => sock.ev.on(i.event, i.func))
   }
   
   #listEvents = (sock, saveCreds) => [
   {
      event: 'messages.upsert',
      func: async ({ type, messages: [message] }) => {
         
         if (!this.online || !isRealMessage(message, message.key.id)) return
         
         const m = await Utils.sms({ ...this, ...sock }, message)
      }
   },
   {
      event: 'connection.update',
      func: async ({ connection, ...update }) => {
         
         if (!sock.authState?.creds?.registered && Boolean(update.qr) && Boolean(this.args.phone)) {
            const code = await sock.requestPairingCode(this.args.phone)
            this.off('code', code)
         }
         
         const isOnline = Boolean(update?.receivedPendingNotifications)
         const isOpen = connection == 'open'
         const isClose = connection == 'close'
         
         if (isClose) {
            
            const statusCode = update.lastDisconnect.error?.output?.statusCode
            
            const isDelete = [DisconnectReason.connectionReplaced,
               DisconnectReason.loggedOut,
               DisconnectReason.badSession
            ].includes(statusCode)
            
            this.close()
            
            if (isDelete) {
               fs.removeSync(this.args.path)
               this.off('status', 'delete')
               return
            }
            
            this.emit('status', 'retry')
            setTimeout(this.start, 4500)
            
         } else if (isOnline || isOpen) {
            if (isOnline) this.online = true
            this.emit('status', isOnline ? 'online' : 'open')
         }
      }
   },
   {
      event: 'creds.update',
      func: saveCreds
   }]
}

module.exports = Socket