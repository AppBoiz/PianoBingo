import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '/legacy-pages/pack-select/pack-select.css'
import { loadAllPacks, selectPack, generateSong, clearGameState } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function PackSelect(){
  const [packs, setPacks] = useState<any[]>([])
  const [selected, setSelected] = useState<number>(1)
  const navigate = useNavigate()
  const { PAGE, loadPage } = useNavigation()

  useEffect(() => {
    let mounted = true
    loadAllPacks().then((data) => {
      if (!mounted) return
      setPacks(data || [])
      if (data && data.length > 0) setSelected(data[0].packId)
    }).catch(err => console.error(err))
    return () => { mounted = false }
  }, [])

  const pickPack = async () => {
    await selectPack(selected)
    await generateSong()
    loadPage('GAME')
  }

  const onBack = () => {
    clearGameState()
    loadPage('WELCOME')
  }

  return (
    <div id="app" className="p-4">
      <div className="back-container">
        <button onClick={onBack}>Back</button>
      </div>
      <h1>Create New Game</h1>
      <h2>Select Song Pack</h2>
      <div className="flex-col mb-40">
        <div className="radios-container">
          {packs.map((pack, idx) => (
            <label className="radio-label" key={pack.packId}>
              <input type="radio" name="radio" value={pack.packId}
                checked={selected === pack.packId}
                onChange={() => setSelected(pack.packId)} />
              {pack.packName}
            </label>
          ))}
        </div>
      </div>
      <button className="select-button" onClick={pickPack}>Start Game</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </div>
  )
}
