import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Verify from './pages/Verify'
import Profile from './pages/Profile'
import Hive from './pages/Hive'
import Legal from './pages/Legal'
import Success from './pages/Success'
import Messages from './pages/Messages'
import './index.css'

export default function App() {
  const [email, setEmail] = useState('')
  const [verified, setVerified] = useState(false)
  const [user, setUser] = useState(null)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home email={email} setEmail={setEmail} />} />
        <Route path="/verify" element={<Verify email={email} setVerified={setVerified} />} />
        <Route path="/profile" element={verified ? <Profile email={email} setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/hive" element={user ? <Hive user={user} /> : <Navigate to="/" />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/success" element={<Success user={user} setUser={setUser} />} />
        <Route path="/messages" element={<Messages user={user} />} />
      </Routes>
    </Router>
  )
}