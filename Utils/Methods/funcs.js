const fs = require('fs-extra')

const Funcs = new class {
   
   isBoolean = value => typeof value === 'boolean';
   
   isFile = ext => /\.js$/.test(ext)
   
   delay = time => new Promise(resolve => setTimeout(resolve, time));
   
   wrJsnSync = (...args) => fs.outputJsonSync(...args, { spaces: 4 })
   rddirSync = (path, opc = {}) => fs.readdirSync(path, { withFileTypes: Boolean(opc.fileType), ...opc })
   
   exJsnSync = path => {
      let exists = fs.pathExistsSync(path)
      exists &&= fs.statSync(path).size > 0
      if (!exists) fs.removeSync(path)
      return exists
   }
   
   wrJsn = (...args) => fs.outputJson(...args, { spaces: 4 })
   
   exJsn = async path => {
      let exists = await fs.pathExists(path)
      exists &&= (await fs.stat(path)).size > 0
      if (!exists) await fs.remove(path)
      return exists
   }
   
   formatBytes = (n = 1024) => {
      let u = ['B', 'KB', 'MB', 'GB'],
         i
      for (i = 0; n >= 1024 && i < 3; i++) {
         n /= 1024
      }
      return Number(n.toFixed(2)) + u[i]
   }
   
}

Object.assign(Funcs, {
   exFileSync: fs.pathExistsSync,
   wrFileSync: fs.writeFileSync,
   rdFileSync: fs.readFileSync,
   rdJsnSync: fs.readJsonSync,
   rmFileSync: fs.removeSync,
   exFile: fs.pathExists,
   wrFile: fs.writeFile,
   rdFile: fs.readFile,
   rdJsn: fs.readJson,
   rmFile: fs.remove,
})

module.exports = { Funcs };