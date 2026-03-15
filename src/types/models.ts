export interface Song {
  songId: number
  title: string
  pdfUrl: string | null
  version?: number
}

export interface Pack {
  packId: number
  packName: string
  songCount?: number
  version?: number
  songs: number[]
}

export interface CurrentSongMetadata {
  songId: number | null
  title: string
  pdfUrl: string | null
}

export interface GameState {
  selectedSongPackId: number | null
  shownSongIds: number[]
  currentSong: CurrentSongMetadata
}

export interface IndexedDbConfig {
  DB_NAME: string
  DB_VERSION: number
  PARTITION_SIZE: number
  SCHEMAS: {
    PACKS: string
    SONGS: string
  }
}