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

export default function App(){
  return (
    <NavigationProvider>
      <Routes>
        <Route path="/" element={<WelcomePage/>} />
        <Route path="/pack-select" element={<PackSelect/>} />
        <Route path="/pdf-reader" element={<PdfReader/>} />
        <Route path="/pack-management" element={<PackManagement/>} />
        <Route path="/pack-edit" element={<PackEdit/>} />
        <Route path="/song-management" element={<SongManagement/>} />
        <Route path="/song-view" element={<SongView/>} />
        <Route path="/game-history" element={<GameHistory/>} />
      </Routes>
    </NavigationProvider>
  )
}
