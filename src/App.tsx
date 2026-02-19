import React from 'react'
import { Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<WelcomePage/>} />
      <Route path="/pack-select" element={<div>PackSelect (TODO)</div>} />
      <Route path="/pdf-reader" element={<div>PdfReader (TODO)</div>} />
      <Route path="/game-history" element={<div>GameHistory (TODO)</div>} />
    </Routes>
  )
}
