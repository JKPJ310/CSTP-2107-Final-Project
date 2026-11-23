import './App.css'
import { Route, Routes } from 'react-router-dom'
import HomePage from './Page/HomePage'
import NotFoundPage from './Page/NotFoundPage'
import SignupPage from './Page/SignupPage'
import LoginPage from './Page/LoginPage'
import DashboardPage from './Page/DashboardPage'
import ChatPage from './Page/ChatPage'
import SettingsPage from './Page/SettingsPage'
import DiaryPage from './Page/DiaryPage'
import NewEntryPage from './Page/NewEntryPage'
import DiaryEntryPage from './Page/DiaryEntryPage'
import GoalsPage from './Page/GoalsPage'
import ComfortKitPage from './Page/ComfortKitPage'
import LettersPage from './Page/LettersPage'
import NewLetterPage from './Page/NewLetterPage'
import LetterPage from './Page/LetterPage'
import ForgotPasswordPage from './Page/ForgotPasswordPage'
import ResetPasswordPage from './Page/ResetPasswordPage'
import AuthCallbackPage from './Page/AuthCallbackPage'
import OnboardingPage from './Page/OnboardingPage'
import Navbar from './components/Navbar'
import PublicOnly from './components/PublicOnly'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <div className='pb-16 md:pb-0'>
      <Navbar />
      <Routes>
        {/* Signed-out pages: signed-in people are sent into the app */}
        <Route path='/' element={<PublicOnly><HomePage /></PublicOnly>} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/login' element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path='/forgot-password' element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
        <Route path='/reset-password' element={<ResetPasswordPage />} />
        <Route path='/auth/callback' element={<AuthCallbackPage />} />
        <Route path='/onboarding' element={<OnboardingPage />} />
        {/* App pages: each one sends signed-out people to Log in */}
        <Route path='/home' element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path='/diary' element={<DiaryPage />} />
        <Route path='/diary/new' element={<NewEntryPage />} />
        <Route path='/diary/:id' element={<DiaryEntryPage />} />
        <Route path='/goals' element={<GoalsPage />} />
        <Route path='/comfort' element={<ComfortKitPage />} />
        <Route path='/letters' element={<LettersPage />} />
        <Route path='/letters/new' element={<NewLetterPage />} />
        <Route path='/letters/:id' element={<LetterPage />} />
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
