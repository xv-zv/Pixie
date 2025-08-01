const {
   makeWASocket,
   useMultiFileAuthState,
   Browsers,
   DisconnectReason,
   getContentType
} = require('@whiskeysockets/baileys')

const pino = require('pino');
const fs = require('fs-extra');
const F = require('./Utils/funcs.js');
const { Events } = require('./Utils/class.js');
const {
   DELETE_SESSION_REASONS,
   RETRY_REASONS
} = require('./Utils/utils.js')

class Socket {
   #sock = null
   #args
   constructor(args) {
      this.#args = args
   }
   
   start = async () => {
      
      const logger = pino({ level: 'silent' })
      const { state, saveCreds } = await useMultiFileAuthState(this.#args.path)
      
      this.#sock = await makeWASocket({
         logger,
         auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
         },
         browser: Browsers.ubuntu('Chrome')
      })
      
      const events = this.#listEvents(saveCreds)
      
      events.forEach(({ func, event }) => {
         this.#sock.ev.on(event, func)
      })
   }
   
   #listEvents = (saveCreds) => [
   {
      event: 'connection.update',
      func: async ({ connection, ...updateCtx }) => {
         
         const isNewReg = Boolean(this.#sock.authState?.creds?.registered)
         const isQrCode = Boolean(updateCtx.qr)
         const isPhone = Boolean(this.#args.phone)
         
         if (isNewReg && isQrCode) {
            if (isPhone) {
               const code = await this.#sock.requestPairingCode(this.#args.phone.replace(/\D/g, ''))
               this.ev.off('code', code)
            }
         }
         
         const isClose = connection == 'close'
         const isOpen = connection == 'open'
         const isOnline = Boolean(updateCtx?.receivedPendingNotifications)
         
         if (isClose) {
            
            const statusCode = updateCtx.lastDisconnect.error?.output?.statusCode
            
            const isDelete = DELETE_SESSION_REASONS.includes(statusCode)
            const isRetry = RETRY_REASONS.includes(statusCode)
            
            if (isDelete) {
               fs.removeSync(this.#args.path)
               this.close()
               return this.ev.emit('status', 'delete')
            }
            if (isRetry) {
               this.close()
               this.ev.emit('status', 'retry')
               this.start()
            }
         } else if (isOnline || isOpen) {
            this.ev.emit('status', isOnline ? 'online' : 'open')
         }
      }
   }]
   
   close = () => {
      if (!this.#sock) return
      this.#sock.ws.close()
      this.#sock.ws.removeAllListeners()
      this.#sock = null
   }
}

Object.defineProperties(Socket.prototype, {
   ev: {
      value: new Events()
   },
   command: {
      value(cmd, func) {
         this.ev.command(cmd, func)
      }
   }
})