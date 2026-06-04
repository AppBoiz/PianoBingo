import type { Song } from '../types/models'

export function compareSongsByPackMembershipThenPackOrder(packSongIds: number[]) {
  return (a: Song, b: Song) => {
    const posA = packSongIds.indexOf(a.songId)
    const posB = packSongIds.indexOf(b.songId)

    if (posA !== -1 && posB !== -1) return posA - posB
    if (posA !== -1) return -1
    if (posB !== -1) return 1

    return a.songId - b.songId
  }
}

