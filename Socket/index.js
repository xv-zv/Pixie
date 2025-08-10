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

class Socket extends Methods {
   
   constructor(args) {
      super()
      this.args = args
   }
   
   start = async () => {
      
      const logger = pino({ level: 'silent' })
      const { state, saveCreds } = await useMultiFileAuthState(this.args.path)
      
      this.sock = await makeWASocket({
         logger,
         auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
         },
         browser: Browsers.ubuntu('Chrome')
      })
      
      const events = this.listEvents(saveCreds)
      for (const { event, func } of events) {
         this.sock.ev.on(event, func)
      }
   }
   
   listEvents = (saveCreds) => [
   {
      event: 'connection.update',
      async func({ connection, ...update }) {
         
         if (!this.sock.authState?.creds?.registered && Boolean(update.qr) && Boolean(this.args.phone)) {
            const code = await this.sock.requestPairingCode(this.args.phone)
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