import type { IndexedDbConfig, Pack, Song } from './models'

declare global {
  interface Window {
    BASE_PACK_DATA?: Pack[]
    BASE_SONG_DATA?: Song[]
    resolvePdfUrl?: (pdfUrl: string) => string | null
    __PDF_LOADED__?: boolean
    __PDF_RENDERED__?: boolean
    __PDF_RENDER_ERROR__?: string | null
    INDEXED_BD_CONFIG?: IndexedDbConfig
  }
}

export {}