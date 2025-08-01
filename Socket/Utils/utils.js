const { DisconnectReason } = require('@whiskeysockets/baileys')

const DELETE_SESSION_REASONS = [
   DisconnectReason.connectionReplaced,
   DisconnectReason.loggedOut,
   DisconnectReason.badSession
]

const RETRY_REASONS = [
   DisconnectReason.connectionClosed,
   DisconnectReason.connectionLost,
   DisconnectReason.timedOut,
   DisconnectReason.restartRequired
]

const CHECK_REASONS = [
   DisconnectReason.multideviceMismatch,
   DisconnectReason.forbidden,
   DisconnectReason.unavailableService
]

module.exports = {
   DELETE_SESSION_REASONS,
   RETRY_REASONS,
   CHECK_REASONS
}