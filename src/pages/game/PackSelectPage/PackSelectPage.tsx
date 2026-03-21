import React, { useEffect, useState } from 'react'
import { selectPack, generateSong, clearGameState } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { usePacks } from '../../packs/hooks/usePacks'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import PackRadioGroup from './molecules/PackRadioGroup'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PackSelectPageHeader from './organisms/PackSelectPageHeader'
import '../../../styles/legacy/pack-select.css'

export default function PackSelectPage(){
  const { packs } = usePacks()
  const [selected, setSelected] = useState<number | null>(null)
  const { loadPage } = useNavigation()

  // Auto-select the first pack once the list loads
  useEffect(() => {
    if (packs.length > 0 && selected === null) {
      setSelected(packs[0].packId)
    }
  }, [packs, selected])

  async function handleStartGame(){
    if (!selected) return
    await selectPack(selected)
    await generateSong()
    loadPage(PAGE_NAME.GAME)
  }

  function handleBack(){
    clearGameState()
    loadPage(PAGE_NAME.WELCOME)
  }

  return (
    <PageLayout
      rootClassName="pack-select-page-root"
      rootTestId="pack-select-page"
      header={<PackSelectPageHeader onBack={handleBack} />}
      skipMainWrapper
    >
      <h1>Create New Game</h1>
      <h2>Select Song Pack</h2>
      <div className="flex-col mb-40">
        <PackRadioGroup packs={packs} selectedPackId={selected} onSelectPack={setSelected} />
      </div>
      <button className="select-button" data-action="start-game" onClick={handleStartGame}>Start Game</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </PageLayout>
  )
}
