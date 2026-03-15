import React from 'react'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PdfReader from './pages/PdfReader'
import PackSelect from './pages/PackSelect'
import PackManagement from './pages/PackManagement'
import PackEdit from './pages/PackEdit'
import SongManagement from './pages/SongManagement'
import { NavigationProvider } from './context/NavigationContext'
import SongView from './pages/SongView'
import GameHistory from './pages/GameHistory'
import { PAGE } from './constants/navigation'

export default function App(){
  return (
    <NavigationProvider>
      <Routes>
        <Route path={PAGE.WELCOME} element={<WelcomePage/>} />
        <Route path={PAGE.PACK_SELECT} element={<PackSelect/>} />
        <Route path={PAGE.GAME} element={<PdfReader/>} />
        <Route path={PAGE.PACK_MANAGEMENT} element={<PackManagement/>} />
        <Route path={`${PAGE.PACK_EDIT}/:packId`} element={<PackEdit/>} />
        <Route path={PAGE.SONG_MANAGEMENT} element={<SongManagement/>} />
        <Route path={`${PAGE.SONG_VIEW}/:songId`} element={<SongView/>} />
        <Route path={PAGE.GAME_HISTORY} element={<GameHistory/>} />
      </Routes>
    </NavigationProvider>
  )
}
