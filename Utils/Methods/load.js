const fs = require('fs-extra')
const PATH = require('path')

class Load {
   constructor(folder) {
      this.folder = folder
      this.files = {
         cmds: {}
      }
   }
   
   load = folder => {
      if (!fs.pathExistsSync(folder)) return
      
      fs.readdirSync(folder, { withFileTypes: true }).forEach(out => {
         
         const path = PATH.join(folder, out.name)
         
         if (out.isDirectory()) {
            this.load(path)
         } else if (out.isFile()) {
            this.read(path, out.name)
         }
      })
      return this
   }
   
   read = (path, name) => {
      if (!/.js$/.test(name)) return
      
      const file = require(path)
      
      if (file) {
         const isCmd = Boolean(file.cmd) && Boolean(file.func)
         const isMedia = !isCmd && Boolean(file.load)
         
         const params = {
            fileName: name,
            active: true,
            ...(isCmd && { isCmd }),
            ...(isMedia && { isMedia }),
            ...Object.fromEntries(Object.entries(file).filter(([c, v]) => typeof v !== 'function')),
            path
         }
         
         const func = Object.assign(file.func, params)
         
         if (isCmd) {
            this.files.cmds[file.cmd] = func
         }
      }
   }
}

module.exports = { Load }