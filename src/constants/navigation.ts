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

export type PageKey = keyof typeof PAGE
export type PagePath = (typeof PAGE)[PageKey]