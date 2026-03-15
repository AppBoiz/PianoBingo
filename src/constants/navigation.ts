export const PAGE = {
  GAME: '/pdf-reader',
  WELCOME: '/',
  PACK_SELECT: '/pack-select',
  GAME_HISTORY: '/game-history',
  PACK_MANAGEMENT: '/pack-management',
  PACK_EDIT: '/pack-edit',
  SONG_MANAGEMENT: '/song-management',
  SONG_VIEW: '/song-view',
} as const

export const PAGE_NAME = {
  GAME: 'GAME',
  WELCOME: 'WELCOME',
  PACK_SELECT: 'PACK_SELECT',
  GAME_HISTORY: 'GAME_HISTORY',
  PACK_MANAGEMENT: 'PACK_MANAGEMENT',
  PACK_EDIT: 'PACK_EDIT',
  SONG_MANAGEMENT: 'SONG_MANAGEMENT',
  SONG_VIEW: 'SONG_VIEW',
} as const

export type PageKey = keyof typeof PAGE
export type PagePath = (typeof PAGE)[PageKey]
export type PageName = (typeof PAGE_NAME)[PageKey]