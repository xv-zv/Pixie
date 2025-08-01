const {
   makeWASocket,
   useMultiFileAuthState,
   Browsers,
   DisconnectReason,
   getContentType
} = require('@whiskeysockets/baileys')

const P = require('pino');
const fs = require('fs-extra');
const F = require('./Utils/funcs.js');

class Socket {
   #args = null
   #sock = null
   constructor(args) {
      this.#args = args
      this.sockOnline = false
   }
   
   #listEvents = (sock, opc = {}) => [
   {
      event: 'creds.update',
      func: opc.saveCreds
   },
   {
      event: 'connection.update',
      func: async ({ connection, ...update }) => {
         
         if (opc.isNewReg && !!update.qr && opc.phone) {
            const token = await this.#sock.requestPairingCode(opc.phone)
            this.off('code', token)
         }
         
         const isClose = connection == 'close'
         const isOpen = connection == 'open'
         const isOnline = Boolean(update.receivedPendingNotifications)
         
         if (isClose) {
            const statusCode = update.lastDisconnect.error?.output?.statusCode
            
            const isDelete = [DisconnectReason.connectionReplaced, DisconnectReason.loggedOut].includes(statusCode)
            
            if (isDelete) {
               fs.removeSync(opc.path)
               this.emit('status', 'delete')
               return this.closeSesion()
            }
            
            this.closeSesion()
            this.emit('status', 'restart')
            this.start()
            
         } else if (isOnline || isOpen) {
            this.sockOnline = true
            this.emit('status', isOnline ? 'online' : 'open')
         }
      }
   },
   {
      event: 'messages.upsert',
      func: ({ type, messages: [msgCtx] }) => {
         
         if (type === 'notify') {
            
            const msg = msgCtx[0].message
            const msgType = getContentType(msg)
            const msg = msg[msgType]
            const body = (msgType == 'conversation') ? msg : (msgType == 'extendedTextMessage') ? msg.text : ['video', 'image', 'document'].some(i => msgType.startsWith(i)) ? msg.caption : null
            
            if (body) {
               
               const isCmd = opc.prefix.some(i => body.startsWith(i))
               
               let text = body.trim()
               
               if (isCmd) {
                  
                  const [cmd, ...args] = body.slice(1).trim().split(/ +/)
                  
                  text = args.join(' ').trim()
                  
               }
            }
         }
      }
   }]
   
   
}

Object.defineProperties(Socket.prototype, {
   start: {
      value: () => {
         
         const logger = P({ level: 'silent' })
         const { state, saveCreds } = await useMultiFileAuthState(this.#args.path)
         
         this.#sock = await makeWASocket({
            logger,
            auth: {
               creds: state.creds,
               keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            browser: Browser.ubuntu('Chrome')
         })
         
         const opc = {
            saveCreds,
            phone: (this.#args.phone || '').replace(/\D/g, ''),
            isNewReg: Boolean(this.#sock.authState?.creds?.isNewReg),
            path: this.#args.path
         }
         
         const events = this.#listEvents(opc)
         
         events.forEach(({ event, func }) => {
            this.#sock.ev.on(event, func)
         })
         
      }
   },
   bot: {
      get() {
         const user = this.#sock.user
         return {
            name: user?.name || 'annonymous',
            id: F.setUser(user?.id || ''),
            lid: F.setUser(user?.lid || '')
         }
      }
   },
   closeSesion: {
      value: () => {
         if (!Boolean(this.sock)) return
         if (this.sockOnline) this.#sock.ws.close()
         this.#sock.ev.removeAllListeners()
         this.#sock = null
      }
   }
})