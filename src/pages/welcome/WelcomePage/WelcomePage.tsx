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
    <PageLayout
      rootId="welcome-page-container"
      rootTestId="welcome-page"
      rootClassName="relative isolate items-center justify-start overflow-hidden px-6 text-center"
      skipMainWrapper
    >
      <WelcomeActionGroup
        logo={<img src="/resources/images/logo.png" alt="PianoBingo Logo" id="logo" className="w-[306px] max-w-full" />}
        actions={[
          { id: 'new-game', label: 'New Game', onClick: newGameButtonHandler },
          { id: 'manage-songs', label: 'Manage Songs', onClick: () => loadPage(PAGE_NAME.SONG_MANAGEMENT) },
          { id: 'manage-playlists', label: 'Manage Playlists', onClick: () => loadPage(PAGE_NAME.PACK_MANAGEMENT) },
        ]}
        banner={<img className="pointer-events-none fixed -bottom-24 -right-[31rem] hidden -rotate-45 lg:block" src="/resources/images/piano.png" alt="" aria-hidden="true" />}
      />
    </PageLayout>
  )
}
