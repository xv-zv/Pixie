class Events {
   
   constructor() {
      this.events = {}
      this.commands = {}
   }
   
   on = (event, listener) => {
      if (this.events[event]) return 
      this.events[event] = listener
      return this
   }
   
   off = (event, ...args) => {
      if (!this.events[event]) return
      if (args.length > 0) {
         this.emit(event, ...args)
      }
      delete this.events[event]
   }
   
   command = (command, listener) => {
      if (this.commands[command]) return
      this.commands[command] = listener
   }
   
   emitCommand = (command, ...args) => {
      if (!this.commands[command]) return
      this.commands[command](...args)
   }
   
   emit = (event, ...args) => {
      if (!this.events[event]) return
      this.events[event](...args)
   }
   
}

module.exports = { Events }