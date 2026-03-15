import React, { useEffect, useState } from 'react'
import { selectPack, generateSong, clearGameState } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'
import { usePacks } from '../hooks/usePacks'

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
    loadPage('GAME')
  }

  function handleBack(){
    clearGameState()
    loadPage('WELCOME')
  }

  return (
    <div id="app" className="p-4">
      <div className="back-container">
        <button onClick={handleBack}>Back</button>
      </div>
      <h1>Create New Game</h1>
      <h2>Select Song Pack</h2>
      <div className="flex-col mb-40">
        <div className="radios-container">
          {packs.map(pack => (
            <label className="radio-label" key={pack.packId}>
              <input type="radio" name="radio" value={pack.packId}
                checked={selected === pack.packId}
                onChange={() => setSelected(pack.packId)} />
              {pack.packName}
            </label>
          ))}
        </div>
      </div>
      <button className="select-button" onClick={handleStartGame}>Start Game</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </div>
  )
}
