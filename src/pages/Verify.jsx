import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Verify({ email, setVerified }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // TEMP: test code bypass
    if (code === '123456') {
      setVerified(true)
      setLoading(false)
      navigate('/profile')
      return
    }

    const { data, error: err } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (err || !data) {
      setError('invalid or expired code. please try again.')
      setLoading(false)
      return
    }

    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', data.id)

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    setVerified(true)
    setLoading(false)

    if (existing) {
      navigate('/hive')
    } else {
      navigate('/profile')
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.logo} onClick={() => navigate('/')}>yellow</button>
      </nav>
      <div style={s.inner}>
        <div style={s.label}>verify your email</div>
        <h2 style={s.title}>check your inbox.</h2>
        <p style={s.sub}>we sent a 6-digit code to <strong style={{color:'#EDD87A'}}>{email}</strong>. enter it below.</p>
        <p style={{...s.sub, color: '#EDD87A', fontSize: '0.75rem'}}>🧪 testing? use code: 123456</p>
        <form onSubmit={handleVerify} style={s.form}>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
            style={s.codeInput}
            maxLength={6}
            required
          />
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'verifying...' : 'verify →'}
          </button>
        </form>
        <p style={s.note}>code expires in 10 minutes · <span style={{color:'#EDD87A',cursor:'pointer'}} onClick={() => navigate('/')}>wrong email?</span></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', display: 'flex', flexDirection: 'column', width: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none', cursor: 'pointer' },
  inner: { maxWidth: 400, width: '100%', margin: '0 auto', padding: 'clamp(4rem, 10vw, 6rem) clamp(1rem, 5vw, 1.5rem) 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  label: { fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EDD87A', marginBottom: '0.8rem' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, fontStyle: 'italic', color: '#F0EDD8', marginBottom: '0.5rem' },
  sub: { fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: '#ccc', lineHeight: 1.7, marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' },
  codeInput: { width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '1rem', color: '#EDD87A', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, textAlign: 'center', letterSpacing: '0.5em', outline: 'none', fontFamily: 'Space Mono, monospace' },
  error: { color: '#ff9999', fontSize: '0.78rem', fontFamily: 'Space Mono, monospace' },
  btn: { width: '100%', background: '#EDD87A', color: '#000', padding: '1rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
  note: { fontSize: '0.7rem', color: '#666', fontFamily: 'Space Mono, monospace', marginTop: '1rem' },
}