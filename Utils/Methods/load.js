const PATH = require('path');
const fs = require('fs-extra');

class Load {
   constructor(path = 'Message') {
      this.path = PATH.join(origen, path)
      this.files = {
         commands: {},
         others: [],
         tags: {}
      }
   }
   
   start = (path = this.path) => {
      if (!fs.pathExistsSync(path)) return
      fs.readdirSync(path, { withFileTypes: true }).forEach(out => {
         const file = PATH.join(path, out.name)
         if (out.isDirectory()) {
            this.start(file)
         } else if (out.isFile()) {
            this.read(file, out.name)
         }
      })
   }
   
   read = (path, name) => {
      
      if (!name.endsWith('.js')) return
      
      const file = require(path)
      
      if (file) {
         
         let isCmd = Boolean(file.command)
         file.type = isCmd ? 'command' : (file.type ?? 'text')
         
         let params = {
            pathName: name,
            active: true,
            ...Object.fromEntries(Object.entries(file).filter(([c, v]) => typeof v !== 'function')),
            path
         }
         
         let func = Object.assign(file.func, params)
         
         if (isCmd) {
            this.files.commands[file.command] = func
         } else if (file.type) {
            this.files.others.push(func)
         }
         if (file.tag) {
            if (!this.files.tags[file.tag]) this.files.tags[file.tag] = []
            this.files.tags[file.tag].push(file.command)
         }
      }
   }
}

module.exports = { Load } 