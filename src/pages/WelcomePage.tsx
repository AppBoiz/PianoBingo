import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function WelcomePage(){
  const nav = useNavigate()

  function newGameButtonHandler(){
    // placeholder: will call startNewGame from storage when ported
    nav('/pack-select')
  }

  return (
    <div id="welcome-page-container">
      <div className="logo-container">
        <img src="/resources/images/logo.png" alt="PianoBingo Logo" id="logo" style={{width:306}} />
      </div>
      <button onClick={newGameButtonHandler}>New Game</button>
      <button onClick={() => nav('/song-management')}>Manage Songs</button>
      <button onClick={() => nav('/pack-management')}>Manage Playlists</button>
      <img className="piano-banner" src="/resources/images/piano.png" />
    </div>
  )
}
