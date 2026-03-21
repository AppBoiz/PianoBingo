import React, { useEffect, useState } from 'react'
import { selectPack, generateSong, clearGameState } from '../../../shared/storage/indexedDb'
import { useNavigation } from '../../../shared/context/NavigationContext'
import { usePacks } from '../../packs/hooks/usePacks'
import { PAGE_NAME } from '../../../shared/constants/navigation'
import PackRadioGroup from './molecules/PackRadioGroup'
import PageLayout from '../../../shared/components/organisms/PageLayout'
import PackSelectPageHeader from './organisms/PackSelectPageHeader'

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
      rootClassName="pack-select-page-root relative isolate items-center overflow-hidden px-6 text-center"
      rootTestId="pack-select-page"
      header={<PackSelectPageHeader onBack={handleBack} />}
      skipMainWrapper
    >
      <h1 className="relative z-10 mt-2 text-4xl font-semibold tracking-tight text-black md:text-[45px]">Create New Game</h1>
      <h2 className="relative z-10 mb-10 mt-10 text-2xl font-medium text-zinc-500 md:mb-12 md:mt-14 md:text-[35px]">Select Song Pack</h2>
      <div className="pack-list-shell scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-400/50 relative z-10 flex w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto pb-4">
        <PackRadioGroup packs={packs} selectedPackId={selected} onSelectPack={setSelected} />
      </div>
      <div className="pack-select-footer relative z-10 flex w-full flex-col items-center justify-start pb-6">
        <button
          className="select-button mb-6 mt-8 h-[70px] w-full max-w-[250px] rounded-[20px] bg-brand-pink text-2xl font-semibold text-white shadow-lg transition hover:bg-brand-pinkDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40"
          data-action="start-game"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      </div>
      <img className="pointer-events-none fixed -bottom-24 -right-[31rem] hidden -rotate-45 lg:block" src="/resources/images/piano.png" alt="" aria-hidden="true" />
    </PageLayout>
  )
}
