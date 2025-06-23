const TEMP_PACK_DATA = [
  {
    packName:"Song pack 1",
    packId:1,
    songCount:2,
    songs: [
      {
        id: 1,
        title: "Song 1",
        artist: "Artist 1",
        pdfUrl: "/tmp/example1.pdf"
      },
      {
        id: 2,
        title: "Song 2",
        artist: "Artist 2",
        pdfUrl: "/tmp/example2.pdf"
      }
    ]
  },
  {
    "packName": "long pack name (dont select me)"
  }
]

// END OF TEMP

const defaultGameState = {
    shownSongIds: [],
    selectedSongPackId: null,
    currentSong: {
        title: '',
        artist: '',
        id: null,
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

function selectPack(packId){
  let tmpState = {...loadGameState()}
  tmpState.selectedSongPackId = packId
  saveGameState(tmpState)
}

function getCurrentSong(){
  const gameState = loadGameState();
  if (gameState) {
    return gameState.currentSong;
  } else {
    return null;
  }
}

function getShownSongIds(){
  const gameState = loadGameState();
  if (gameState) {
    return gameState.shownSongIds;
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

function generateSong() {
  const shownSongIds = getShownSongIds();
  const selectedPackId = getSelectedSongPackId();

  // Find the selected pack
  const selectedPack = TEMP_PACK_DATA.find(pack => pack.packId === selectedPackId);

  if (!selectedPack) {
    console.warn("Selected pack not found");
    return null;
  }

  // Filter songs not in shownSongIds
  const availableSongs = selectedPack.songs.filter(song => !shownSongIds.includes(song.id));

  if (availableSongs.length === 0) {
    console.warn("No more songs available in this pack");
    return null;
  }

  // Pick a random available song
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  const selectedSong = availableSongs[randomIndex];

  let tmpState = {...loadGameState()}

  tmpState.currentSong = { ...selectedSong };
  tmpState.shownSongIds.push(selectedSong.id)

  saveGameState(tmpState)
}