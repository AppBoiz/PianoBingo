const PAGE = {
  GAME: 'pages/pdf-reader/pdf-reader.html',
  WELCOME: 'pages/welcome-page/welcome-page.html'
};

function loadPage(page) {
  const message = { type: 'goToPage', page };
  window.parent.postMessage(message, '*');
}
