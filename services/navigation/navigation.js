const PAGE = {
  GAME: 'pages/pdf-reader/pdf-reader.html',
  WELCOME: 'pages/welcome-page/welcome-page.html',
  PACK_SELECT: '../pages/pack-select/pack-select.html',
  GAME_HISTORY: 'pages/game-history/game-history.html',
  PACK_MANAGEMENT: 'pages/pack-management/pack-management.html',
  PACK_EDIT: 'pages/pack-edit/pack-edit.html',
  SONG_MANAGEMENT: 'pages/song-management/song-management.html',
  SONG_VIEW: 'pages/song-view/song-view.html'
};

let last_page = "";

function loadPage(page) {
  if(page != last_page){
    const message = { type: 'goToPage', page };
    window.parent.postMessage(message, '*');
  }
  last_page = page
}
