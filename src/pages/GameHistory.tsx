import React, { useEffect, useState } from 'react'
import { loadGameState } from '../storage/indexedDb'
import { useNavigation } from '../context/NavigationContext'

export default function GameHistory(){
  const [history, setHistory] = useState<any[]>([])
  const { loadPage } = useNavigation()

  useEffect(() => { fetchHistory() }, [])

  function fetchHistory(){
    // The legacy app stored only the current game state in localStorage.
    // We'll display the current state as a minimal history entry to preserve parity.
    const state = loadGameState()
    if (state) setHistory([state])
    else setHistory([])
  }

  return (
    <div className="game-history-root">
      <div className="nav-bar">
        <button onClick={() => loadPage('WELCOME')}>Back</button>
        <h1>Game History</h1>
      </div>
      <div className="history-list">
        {history.length === 0 && <div className="empty">No history available</div>}
        {history.map((h, idx) => (
          <div key={idx} className="history-row">
            <div>Selected pack: {h.selectedSongPackId}</div>
            <div>Shown songs: {(h.shownSongIds || []).length}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
