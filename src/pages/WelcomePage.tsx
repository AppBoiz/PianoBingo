import { useNavigation } from '../context/NavigationContext'
import { startNewGame } from '../storage/indexedDb'
import { PAGE_NAME } from '../constants/navigation'

export default function WelcomePage(){
  const { loadPage } = useNavigation()

  function newGameButtonHandler(){
    startNewGame()
    loadPage(PAGE_NAME.PACK_SELECT)
  }

  return (
    <div id="welcome-page-container">
      <div className="logo-container">
        <img src="/resources/images/logo.png" alt="PianoBingo Logo" id="logo" style={{width:306}} />
      </div>
      <button onClick={newGameButtonHandler}>New Game</button>
      <button onClick={() => loadPage(PAGE_NAME.SONG_MANAGEMENT)}>Manage Songs</button>
      <button onClick={() => loadPage(PAGE_NAME.PACK_MANAGEMENT)}>Manage Playlists</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </div>
  )
}
