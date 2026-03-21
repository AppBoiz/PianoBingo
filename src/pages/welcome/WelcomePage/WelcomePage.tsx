import { useNavigation } from '../../../shared/context/NavigationContext'
import { startNewGame } from '../../../shared/storage/indexedDb'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import WelcomeActionGroup from './molecules/WelcomeActionGroup'
import PageLayout from '../../../shared/components/organisms/PageLayout'

export default function WelcomePage(){
  const { loadPage } = useNavigation()

  function newGameButtonHandler(){
    startNewGame()
    loadPage(PAGE_NAME.PACK_SELECT)
  }

  return (
    <PageLayout rootId="welcome-page-container" rootTestId="welcome-page" skipMainWrapper>
      <WelcomeActionGroup
        logo={<img src="/resources/images/logo.png" alt="PianoBingo Logo" id="logo" style={{ width: 306 }} />}
        actions={[
          { id: 'new-game', label: 'New Game', onClick: newGameButtonHandler },
          { id: 'manage-songs', label: 'Manage Songs', onClick: () => loadPage(PAGE_NAME.SONG_MANAGEMENT) },
          { id: 'manage-playlists', label: 'Manage Playlists', onClick: () => loadPage(PAGE_NAME.PACK_MANAGEMENT) },
        ]}
        banner={<img className="piano-banner" src="/resources/images/piano.png" />}
      />
    </PageLayout>
  )
}
