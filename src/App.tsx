import React from 'react'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/welcome/WelcomePage/WelcomePage'
import GamePage from './pages/game/GamePage/GamePage'
import PackSelectPage from './pages/game/PackSelectPage/PackSelectPage'
import PackManagementPage from './pages/packs/PackManagementPage/PackManagementPage'
import PackEditPage from './pages/packs/PackEditPage/PackEditPage'
import SongManagementPage from './pages/songs/SongManagementPage/SongManagementPage'
import { NavigationProvider } from './shared/context/NavigationContext'
import SongViewPage from './pages/songs/SongViewPage/SongViewPage'
import GameHistoryPage from './pages/game/GameHistoryPage/GameHistoryPage'
import { PAGE } from './shared/constants/navigation'

export default function App(){
  return (
    <NavigationProvider>
      <Routes>
        <Route path={PAGE.WELCOME} element={<WelcomePage/>} />
        <Route path={PAGE.PACK_SELECT} element={<PackSelectPage/>} />
        <Route path={PAGE.GAME} element={<GamePage/>} />
        <Route path={PAGE.PACK_MANAGEMENT} element={<PackManagementPage/>} />
        <Route path={`${PAGE.PACK_EDIT}/:packId`} element={<PackEditPage/>} />
        <Route path={PAGE.SONG_MANAGEMENT} element={<SongManagementPage/>} />
        <Route path={`${PAGE.SONG_VIEW}/:songId`} element={<SongViewPage/>} />
        <Route path={PAGE.GAME_HISTORY} element={<GameHistoryPage/>} />
      </Routes>
    </NavigationProvider>
  )
}
