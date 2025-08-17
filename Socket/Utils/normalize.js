exports.media = url => Buffer.isBuffer(url) ? url : { url }
exports.desc = txt => typeof txt == 'string' ? txt : txt.desc

exports.group = data => {
   if (!data) return {}
   const admins = data.participants.filter(i => i.admin !== null).map(i => i.id)
   const users = data.participants.map(i => i.id)
   const isComm = data.isCommunity
   const ephemeral = data.ephemeralDuration
   const useLid = data.addressingMode == 'lid'
   
   return {
      id: data.id,
      name: data.subject,
      owner: data.owner,
      size: data.size,
      creation: data.creation,
      open: !data.announce,
      ...(isComm && { isComm }),
      ...(isComm && { parent: data.linkedParent }),
      ...(useLid && { useLid }),
      admins,
      users,
      ...(data.desc && { desc: data.desc }),
      ...(ephemeral && { ephemeral })
   }
}

exports.gpUpdate = (action) => {
   let func = null
   if(['add','remove','promote','demote'].includes(action)) {
      return {
         action,
         func: 'groupParticipantsUpdate'
      }
   }
   if(['open','close'].includes('action')){
      return {
         action: action == 'open' ? 'not_announcement' : 'announcement',
         func: 'groupSettingUpdate'
      }
   }
}