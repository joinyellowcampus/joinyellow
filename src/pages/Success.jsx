import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Success({ user, setUser }) {
  const navigate = useNavigate()

  useEffect(() => {
    async function updateStatus() {
      if (!user?.email) return
      await supabase
        .from('users')
        .update({ subscription_status: 'paid' })
        .eq('email', user.email)
      setUser({ ...user, subscription_status: 'paid' })
    }
    updateStatus()
  }, [])

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.logo}>yellow</button>
      </nav>
      <div style={s.inner}>
        <div style={s.emoji}>🐝</div>
        <h2 style={s.title}>you're in.</h2>
        <p style={s.sub}>messaging is now unlocked. go find your people.</p>
        <button style={s.btn} onClick={() => navigate('/hive')}>go to the hive →</button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', width: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none' },
  inner: { maxWidth: 400, width: '100%', margin: '0 auto', padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 1.5rem) 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' },
  emoji: { fontSize: '3rem' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A' },
  sub: { fontSize: '1rem', color: '#ccc', lineHeight: 1.7 },
  btn: { background: '#EDD87A', color: '#000', padding: '1rem 2.5rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '1rem' },
}