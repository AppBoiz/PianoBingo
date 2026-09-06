import type { Song } from '../../../../shared/types/models'

/**
 * Transforms pack.songs (array of songIds) into displaySlots (array of Song | null).
 * Fills 75 slots: slots with matching songIds get the Song object, others are null.
 */
export function displaySlotsFromPackSongs(
  packSongs: number[],
  allSongs: Song[],
  slotCount: number = 75
): (Song | null)[] {
  const slots: (Song | null)[] = Array(slotCount).fill(null)
  const songMap = new Map(allSongs.map(s => [s.songId, s]))

  packSongs.slice(0, slotCount).forEach((songId, index) => {
    const song = songMap.get(songId)
    if (song) {
      slots[index] = song
    }
  })

  return slots
}

/**
 * Transforms displaySlots back into pack.songs (array of songIds).
 * Filters out null entries and preserves order.
 */
export function packSongsFromDisplaySlots(displaySlots: (Song | null)[]): number[] {
  return displaySlots
    .filter((song): song is Song => song !== null)
    .map(song => song.songId)
}
