exports.funcs = new class {
   
   delay = time => new Promise(res => setTimeout(res, time))
   
}