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
   
   async start(args) {
      
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
      
      const events = this.#listEvents(saveCreds)
      
      events.forEach(({ event, func }) => this.sock.ev.on(event, func))
   }
   
   #listEvents = (saveCreds) => [
   {
      event: 'creds.update',
      func: saveCreds
   },
   {
      event: 'connection.update',
      func({ connection, ...update }) {
         
         if (!this.sock.authState?.creds?.registered && Boolean(update.qr) && Boolean(this.args.phone)) {
            const code = await this.sock.requestPairingCode(this.args.phone)
            this.off('code', code)
         }
         
         const isOnline = Boolean(update?.receivedPendingNotifications)
         const isOpen = connection == 'open'
         
         if (connection == 'close') {
            
            const statusCode = update.lastDisconnect.error?.output?.statusCode
            
            if ([DisconnectReason.connectionReplaced,
                  DisconnectReason.loggedOut,
                  DisconnectReason.badSession
               ].includes(statusCode)) {
               fs.removeSync(this.args.path)
               this.close()
               this.off('status', 'delete')
            }
            
            if ([DisconnectReason.connectionClosed,
                  DisconnectReason.connectionLost,
                  DisconnectReason.timedOut,
                  DisconnectReason.restartRequired
               ].includes(statusCode)) {
               this.close()
               this.emit('status', 'retry')
               setTimeout(this.start, 4500)
            }
         } else if (isOnline || isOpen) {
            this.emit('status', isOnline ? 'online' : 'open')
         }
      }
   }]
   
   close() {
      if (!this.sock) return
      if (this.online) this.sock.ws.close()
      this.sock.ws.removeAllListeners()
      this.sock = null
   }
   
}