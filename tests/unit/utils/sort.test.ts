import { compareSongsByPackMembershipThenPackOrder } from '../../../src/shared/utils/sort'
import type { Song } from '../../../src/shared/types/models'

function makeSong(songId: number): Song {
  return { songId, title: `Song ${songId}`, pdfUrl: null }
}

describe('compareSongsByPackMembershipThenPackOrder', () => {
  describe('both songs in pack', () => {
    test('returns a negative value when a comes before b in pack order', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([1, 2, 3])
      expect(cmp(makeSong(1), makeSong(2))).toBeLessThan(0)
    })

    test('returns a positive value when a comes after b in pack order', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([1, 2, 3])
      expect(cmp(makeSong(2), makeSong(1))).toBeGreaterThan(0)
    })

    test('returns 0 when a and b are the same song', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([1, 2])
      expect(cmp(makeSong(1), makeSong(1))).toBe(0)
    })

    test('sorts a full array by pack order', () => {
      const songs = [makeSong(3), makeSong(1), makeSong(2)]
      const sorted = [...songs].sort(compareSongsByPackMembershipThenPackOrder([1, 2, 3]))
      expect(sorted.map(s => s.songId)).toEqual([1, 2, 3])
    })

    test('preserves a multi-element pack order', () => {
      const packIds = [10, 20, 30, 40, 50]
      const songs = [makeSong(50), makeSong(30), makeSong(10), makeSong(40), makeSong(20)]
      const sorted = [...songs].sort(compareSongsByPackMembershipThenPackOrder(packIds))
      expect(sorted.map(s => s.songId)).toEqual([10, 20, 30, 40, 50])
    })
  })

  describe('both songs not in pack', () => {
    test('falls back to ascending songId order', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([99])
      expect(cmp(makeSong(5), makeSong(3))).toBeGreaterThan(0)
      expect(cmp(makeSong(3), makeSong(5))).toBeLessThan(0)
    })

    test('sorts by songId when packSongIds is empty', () => {
      const songs = [makeSong(10), makeSong(1), makeSong(5)]
      const sorted = [...songs].sort(compareSongsByPackMembershipThenPackOrder([]))
      expect(sorted.map(s => s.songId)).toEqual([1, 5, 10])
    })
  })

  describe('one song in pack, one not', () => {
    test('song in pack comes before song not in pack', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([2])
      expect(cmp(makeSong(2), makeSong(99))).toBeLessThan(0)
    })

    test('song not in pack comes after song in pack', () => {
      const cmp = compareSongsByPackMembershipThenPackOrder([2])
      expect(cmp(makeSong(99), makeSong(2))).toBeGreaterThan(0)
    })

    test('mixed array puts pack members first, then by songId', () => {
      const packIds = [30, 10]
      // song 5 and 50 not in pack → sorted by songId after pack members
      const songs = [makeSong(50), makeSong(30), makeSong(5), makeSong(10)]
      const sorted = [...songs].sort(compareSongsByPackMembershipThenPackOrder(packIds))
      expect(sorted.map(s => s.songId)).toEqual([30, 10, 5, 50])
    })
  })
})
