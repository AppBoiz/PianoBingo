import React from 'react'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/welcome/WelcomePage/WelcomePage'
import Game from './pages/game/Game/Game'
import PackSelect from './pages/game/PackSelect/PackSelect'
import PackManagement from './pages/packs/PackManagement/PackManagement'
import PackEdit from './pages/packs/PackEdit/PackEdit'
import SongManagement from './pages/songs/SongManagement/SongManagement'
import { NavigationProvider } from './shared/context/NavigationContext'
import SongView from './pages/songs/SongView/SongView'
import GameHistory from './pages/game/GameHistory/GameHistory'
import { PAGE } from './shared/constants/navigation'

export default function App(){
  return (
    <NavigationProvider>
      <Routes>
        <Route path={PAGE.WELCOME} element={<WelcomePage/>} />
        <Route path={PAGE.PACK_SELECT} element={<PackSelect/>} />
        <Route path={PAGE.GAME} element={<Game/>} />
        <Route path={PAGE.PACK_MANAGEMENT} element={<PackManagement/>} />
        <Route path={`${PAGE.PACK_EDIT}/:packId`} element={<PackEdit/>} />
        <Route path={PAGE.SONG_MANAGEMENT} element={<SongManagement/>} />
        <Route path={`${PAGE.SONG_VIEW}/:songId`} element={<SongView/>} />
        <Route path={PAGE.GAME_HISTORY} element={<GameHistory/>} />
      </Routes>
    </NavigationProvider>
  )
}
