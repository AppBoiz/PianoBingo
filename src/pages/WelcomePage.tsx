import { useNavigation } from '../context/NavigationContext'

export default function WelcomePage(){
  const { loadPage } = useNavigation()

  function newGameButtonHandler(){
    // TODO: will call startNewGame from storage when ported
    loadPage('PACK_SELECT')
  }

  return (
    <div id="welcome-page-container">
      <div className="logo-container">
        <img src="/resources/images/logo.png" alt="PianoBingo Logo" id="logo" style={{width:306}} />
      </div>
      <button onClick={newGameButtonHandler}>New Game</button>
      <button onClick={() => loadPage('SONG_MANAGEMENT')}>Manage Songs</button>
      <button onClick={() => loadPage('PACK_MANAGEMENT')}>Manage Playlists</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </div>
  )
}
