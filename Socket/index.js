const {
   makeCacheableSignalKeyStore,
   makeWASocket,
   DisconnectReason,
   Browsers,
   useMultiFileAuthState
} = require('@whiskeysockets/bailyes');
const Utils = require('./Utils');
const fs = require('fs-extra');
const pino = require('pino');

class Socket extends Utils.Methods {
   
   constructor(args) {
      super()
      this.sock = null
      this.args = args
      this.online = false
   }
   
   start = async () => {
      
      const logger = pino({ level: 'silent' })
      const { state, saveCreds } = await useMultiFileAuthState(args.path)
      
      this.sock = await makeWASocket({
         logger,
         auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
         },
         browser: Browsers.ubuntu('Chrome'),
         shouldIgnoreJid: (id) => {
            const ids = Array.isArray(args.ignore) ? args.ignore : [args.ignore].filter(Boolean)
            return ids.includes(id)
         }
      })
      
      const events = this.listEvents(saveCreds)
      for (const { event, func } of events) {
         this.sock.ev.on(event, func)
      }
   }
   
   listEvents = (saveCreds) => [
   {
      event: 'connection.update',
      func: ({ connection, ...update }) => {
         
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
   
   close = () => {
      if (!this.sock) return
      if (this.online) {
         this.online = false
         this.sock.ws.close()
      }
      this.sock.ws.removeAllListeners()
      this.sock = null
   }
   
}