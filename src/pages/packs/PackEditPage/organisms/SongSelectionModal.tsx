import React, { useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Song } from '../../../../shared/types/models'

interface SongSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSongs: Song[]
  alreadySelectedSongIds: number[]
  onSongSelect: (songId: number, slotIndex: number) => void
  currentSlotIndex: number | null
}

export default function SongSelectionModal({
  open,
  onOpenChange,
  allSongs,
  alreadySelectedSongIds,
  onSongSelect,
  currentSlotIndex,
}: SongSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Sort songs alphabetically and filter by search term
  const filteredSongs = useMemo(() => {
    const sorted = [...allSongs].sort((a, b) =>
      a.title.localeCompare(b.title)
    )
    if (!searchTerm.trim()) return sorted
    return sorted.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [allSongs, searchTerm])

  function handleSongClick(songId: number) {
    if (currentSlotIndex !== null) {
      onSongSelect(songId, currentSlotIndex)
      onOpenChange(false)
      setSearchTerm('')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2
            w-[90vw] max-w-sm max-h-[80vh]
            -translate-x-1/2 -translate-y-1/2
            rounded-lg bg-white p-6 shadow-xl flex flex-col
          "
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <Dialog.Title className="text-lg font-semibold">
            Select a Song
          </Dialog.Title>

          <div className="mt-4 flex flex-col flex-1 gap-4 overflow-hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by song name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink"
                data-testid="song-search-input"
                autoFocus
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No songs match your search
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredSongs.map(song => {
                    const isSelected = alreadySelectedSongIds.includes(song.songId)
                    return (
                      <button
                        key={song.songId}
                        type="button"
                        onClick={() => handleSongClick(song.songId)}
                        disabled={isSelected}
                        className={`text-left px-4 py-3 rounded-lg transition ${
                          isSelected
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-white hover:bg-gray-50 text-zinc-800 cursor-pointer'
                        }`}
                        data-testid={`song-item-${song.songId}`}
                      >
                        {song.title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
