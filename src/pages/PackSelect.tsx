import React, { useEffect, useState } from 'react'
import { selectPack, generateSong, clearGameState } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { usePacks } from '../hooks/usePacks'
import { PAGE_NAME } from '../constants/navigation'
import PackRadioGroup from '../components/molecules/PackRadioGroup'
import PageLayout from '../components/organisms/PageLayout'
import PackSelectHeader from '../components/organisms/PackSelectHeader'

export default function PackSelect(){
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
      rootClassName="p-4"
      header={<PackSelectHeader onBack={handleBack} />}
      skipMainWrapper
    >
      <h1>Create New Game</h1>
      <h2>Select Song Pack</h2>
      <div className="flex-col mb-40">
        <PackRadioGroup packs={packs} selectedPackId={selected} onSelectPack={setSelected} />
      </div>
      <button className="select-button" onClick={handleStartGame}>Start Game</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </PageLayout>
  )
}
