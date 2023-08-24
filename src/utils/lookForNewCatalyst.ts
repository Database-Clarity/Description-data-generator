import { SocketTypes } from '@icemourne/tool-box'

export const lookForNewCatalyst = (socketTypes: SocketTypes, hash: number) => {
  const catalystHashes = socketTypes[hash].plugWhitelist.flatMap((socket) => {
    if (socket.reinitializationPossiblePlugHashes) return socket.reinitializationPossiblePlugHashes
    return []
  })

  if (catalystHashes.length === 0) return
  return catalystHashes
}
