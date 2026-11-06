import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './Page/HomePage'
import AssessmentPage from './Page/AssessmentPage'
import ResultsPage from './Page/ResultsPage'
import TipsPage from './Page/TipsPage'
import NotFoundPage from './Page/NotFoundPage'
import SignupPage from './Page/SignupPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/assessment' element={<AssessmentPage />} />
        <Route path='/results' element={<ResultsPage />} />
        <Route path='/tips' element={<TipsPage />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
