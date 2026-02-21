const PAGE = {
  GAME: '/legacy-pages/pdf-reader/pdf-reader.html',
  WELCOME: '/legacy-pages/welcome-page/welcome-page.html',
  PACK_SELECT: '/legacy-pages/pack-select/pack-select.html',
  GAME_HISTORY: '/legacy-pages/game-history/game-history.html',
  PACK_MANAGEMENT: '/legacy-pages/pack-management/pack-management.html',
  PACK_EDIT: '/legacy-pages/pack-edit/pack-edit.html',
  SONG_MANAGEMENT: '/legacy-pages/song-management/song-management.html',
  SONG_VIEW: '/legacy-pages/song-view/song-view.html'
};

let last_page = "";

function loadPage(page) {
  if(page != last_page){
    const message = { type: 'goToPage', page };
    window.parent.postMessage(message, '*');
  }
  last_page = page
}
