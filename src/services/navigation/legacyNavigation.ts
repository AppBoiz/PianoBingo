export const PAGE: Record<string,string> = {
  GAME: '/pdf-reader',
  WELCOME: '/',
  PACK_SELECT: '/pack-select',
  GAME_HISTORY: '/game-history',
  PACK_MANAGEMENT: '/pack-management',
  PACK_EDIT: '/pack-edit',
  SONG_MANAGEMENT: '/song-management',
  SONG_VIEW: '/song-view'
}

// For legacy pages running outside React, post a message to parent (iframe host)
export function loadPageLegacy(page: string){
  try {
    const message = { type: 'goToPage', page }
    window.parent.postMessage(message, '*')
  } catch (e) {
    // no-op
  }
}
