const {
   makeCacheableSignalKeyStore,
   makeWASocket,
   DisconnectReason,
   Browsers,
   useMultiFileAuthState
} = require('@whiskeysockets/baileys');
const { Methods, ...Utils } = require('./Utils');
const fs = require('fs-extra');
const pino = require('pino');

class Socket {
   
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
      
      Object.assign(this, (new Methods(sock)))
      this.#listEvents(sock, saveCreds).forEach(i => sock.ev.on(i.event, i.func))
   }
   
   #listEvents = (sock , saveCreds) => [
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
            this.online = true
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