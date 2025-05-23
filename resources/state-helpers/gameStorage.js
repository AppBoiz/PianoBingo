const defaultGameState = {
    shownSongIndexes: [],
    selectedSongPackId: null,
    currentSong: {
        title: '',
        artist: '',
        index: null,
        pdfUrl: '',
    }
};

function saveGameState(gameState) {
  const gameStateString = JSON.stringify(gameState);
  localStorage.setItem('gameState', gameStateString);
}

function loadGameState() {
  const gameStateString = localStorage.getItem('gameState');
  if (gameStateString) {
    const gameState = JSON.parse(gameStateString);
    return gameState
  } else {
    return null;
  }
}

function clearGameState() {
  localStorage.removeItem('gameState');
}

function startNewGame(){
  saveGameState(defaultGameState);
  return defaultGameState;
}

function getCurrentSong(){
  const gameState = loadGameState();
  if (gameState) {
    return gameState.currentSong;
  } else {
    return null;
  }
}

function getShownSongIndexes(){
  const gameState = loadGameState();
  if (gameState) {
    return gameState.shownSongIndexes;
  } else {
    return null;
  }
}

function getSelectedSongPackId(){
  const gameState = loadGameState();
  if (gameState) {
    return gameState.selectedSongPackId;
  } else {
    return null;
  }
}