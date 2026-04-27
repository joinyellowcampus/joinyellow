import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home({ email, setEmail }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState('home') // home, learn, legal
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@stonybrook.edu')) {
      setError('must be a valid @stonybrook.edu email.')
      return
    }

    setLoading(true)

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Save code to supabase
    await supabase.from('verification_codes').upsert({
      email,
      code,
      expires_at: expires,
      used: false
    })

    // Send email via Netlify function
    await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    })

    setLoading(false)
    navigate('/verify')
  }

  if (page === 'learn') return <LearnMore onBack={() => setPage('home')} onJoin={() => setPage('home')} />
  if (page === 'legal') return <Legal onBack={() => setPage('home')} />

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      <nav style={styles.nav}>
        <button style={styles.logo} onClick={() => setPage('home')}>yellow</button>
        <div style={styles.navLinks}>
          <button style={styles.navLink} onClick={() => setPage('learn')}>learn more</button>
          <button style={styles.navLink} onClick={() => setPage('legal')}>legal</button>
        </div>
      </nav>

      <div style={styles.hero}>
        <div style={styles.pill}>🐝 Stony Brook University</div>
        <h1 style={styles.h1}>don't do your college<br />experience <em style={styles.em}>alone.</em></h1>
        <p style={styles.sub}>yellow connects SBU students by area, major, and vibe. browse free — connect when you're ready.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="you@stonybrook.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'sending code...' : 'get started →'}
          </button>
          <p style={styles.note}>SBU email only · free to join · upgrade to connect</p>
        </form>
      </div>
    </div>
  )
}

function LearnMore({ onBack, onJoin }) {
  const [open, setOpen] = useState(null)

  const toggleAccordion = (i) => setOpen(open === i ? null : i)

  const items = [
    {
      title: 'Sign up',
      body: ['SBU email only. No outsiders. Your info stays within the community.', 'Set your major, year, and area (East LI, West LI, Stony Brook, NYC).', 'Pick what you\'re looking for: study, hang out, buddy, carpool.']
    },
    {
      title: 'Explore',
      body: ['Browse SBU students by area, major, and vibe. No payment needed.', 'On-campus or off-campus, you choose.', 'See who\'s already out there looking for the same thing.']
    },
    {
      title: 'Connect',
      body: ['Found someone you want to talk to? Unlock messaging: $1.99 first month, $4.99/month after.', 'Secure and private. No need to share your number.', 'No outsiders. Just SBU.']
    }
  ]

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.logo} onClick={onBack}>yellow</button>
        <button style={styles.navLink} onClick={onBack}>← back</button>
      </nav>
      <div style={styles.learnInner}>
        <div style={styles.pageLabel}>what this is</div>
        <p style={styles.learnP}>this is for SBU students who want <strong>real connection on campus.</strong></p>
        <p style={styles.learnP}>if you've been feeling like it's harder than it should be to meet people here — you're not alone, and you're not imagining it.</p>
        <p style={styles.learnP}>yellow is being built by a student at SBU, for students at SBU.</p>

        <div style={styles.divider} />

        <div style={styles.howLabel}>Sign up → Explore → Connect</div>
        {items.map((item, i) => (
          <div key={i} style={styles.accordionItem}>
            <button style={styles.accordionTrigger} onClick={() => toggleAccordion(i)}>
              {item.title} <span>{open === i ? '▴' : '▾'}</span>
            </button>
            {open === i && (
              <ul style={styles.accordionBody}>
                {item.body.map((b, j) => <li key={j} style={styles.accordionLi}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}

        <div style={styles.divider} />
        <p style={styles.learnP}>yellow is a membership-based platform. you won't be charged until you decide to connect with someone. <strong>$1.99 first month · $4.99/month after.</strong></p>
        <div style={styles.divider} />
        <button style={styles.btn} onClick={onJoin}>get started →</button>
      </div>
    </div>
  )
}

function Legal({ onBack }) {
  const [tab, setTab] = useState('terms')
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <button style={styles.logo} onClick={onBack}>yellow</button>
        <button style={styles.navLink} onClick={onBack}>← back</button>
      </nav>
      <div style={styles.learnInner}>
        <div style={styles.pageLabel}>legal</div>
        <div style={styles.tabNav}>
          <button style={{...styles.tabBtn, ...(tab === 'terms' ? styles.tabActive : {})}} onClick={() => setTab('terms')}>Terms</button>
          <button style={{...styles.tabBtn, ...(tab === 'privacy' ? styles.tabActive : {})}} onClick={() => setTab('privacy')}>Privacy</button>
        </div>
        {tab === 'terms' && (
          <div>
            <p style={styles.legalHighlight}>by joining yellow, you agree to these terms.</p>
            <h3 style={styles.legalH}>who we are</h3>
            <p style={styles.legalP}>yellow is an independent student-made platform — not affiliated with Stony Brook University or SUNY.</p>
            <h3 style={styles.legalH}>eligibility</h3>
            <p style={styles.legalP}>enrolled SBU student with a valid @stonybrook.edu email. you must agree to these terms.</p>
            <h3 style={styles.legalH}>payments</h3>
            <p style={styles.legalP}>first month $1.99, then $4.99/month. cancel anytime. you are not charged until you choose to unlock messaging.</p>
            <h3 style={styles.legalH}>acceptable use</h3>
            <p style={styles.legalP}>no harassment, no explicit content, no sharing personal contact info in your bio, no impersonation.</p>
            <h3 style={styles.legalH}>no liability for user interactions</h3>
            <p style={styles.legalHighlight}>yellow is a connecting platform only. we are not responsible for any interactions or meetups between users.</p>
          </div>
        )}
        {tab === 'privacy' && (
          <div>
            <p style={styles.legalHighlight}>we do not sell your data. ever.</p>
            <h3 style={styles.legalH}>what we collect</h3>
            <p style={styles.legalP}>your SBU email, profile info (major, year, area, bio, prompts), and optional photo. payments processed by Stripe — we never store card details.</p>
            <h3 style={styles.legalH}>what we don't collect</h3>
            <p style={styles.legalP}>your real-time location, academic records, or anything you don't choose to share.</p>
            <h3 style={styles.legalH}>your rights</h3>
            <p style={styles.legalP}>you can edit or delete your profile at any time.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', position: 'relative', overflowX: 'hidden' },
  glow: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(237,216,122,0.05) 0%, transparent 60%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' },  logo: { fontFamily: 'Fraunces, serif', fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none', cursor: 'pointer' },
  navLinks: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  navLink: { fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', background: 'none', border: 'none', cursor: 'pointer' },
  hero: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 5vw, 1.5rem) 4rem', textAlign: 'center', position: 'relative', zIndex: 1 },  pill: { display: 'inline-block', background: '#EDD87A', color: '#000', padding: '0.4rem 1.1rem', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2rem' },
  h1: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.2rem' },
  em: { fontStyle: 'italic', color: '#EDD87A' },
  sub: { fontSize: '1.1rem', color: '#ccc', lineHeight: 1.75, maxWidth: 480, marginBottom: '2.5rem' },
  form: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: 400 },
  input: { width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.95rem 1rem', color: '#F0EDD8', fontSize: '1rem', outline: 'none' },
  error: { color: '#ff9999', fontSize: '0.78rem', fontFamily: 'Space Mono, monospace' },
  btn: { width: '100%', background: '#EDD87A', color: '#000', padding: '1rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
  note: { fontSize: '0.7rem', color: '#666', fontFamily: 'Space Mono, monospace', letterSpacing: '0.04em' },
  learnInner: { maxWidth: 620, width: '100%', margin: '0 auto', padding: '8rem 1.5rem 4rem', position: 'relative', zIndex: 1 },
  pageLabel: { fontFamily: 'Space Mono, monospace', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#EDD87A', marginBottom: '2rem' },
  learnP: { fontSize: '1.05rem', color: '#ccc', lineHeight: 1.9, marginBottom: '1.5rem' },
  divider: { width: 40, height: 1, background: 'rgba(237,216,122,0.25)', margin: '1.2rem 0' },
  howLabel: { fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EDD87A', marginBottom: '0.8rem' },
  accordionItem: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
  accordionTrigger: { width: '100%', background: 'none', border: 'none', padding: '0.9rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700, color: '#F0EDD8', textAlign: 'left' },
  accordionBody: { listStyle: 'none', padding: '0.1rem 0 1rem' },
  accordionLi: { fontSize: '1rem', color: '#ccc', padding: '0.4rem 0 0.4rem 1.1rem', position: 'relative', lineHeight: 1.65 },
  tabNav: { display: 'flex', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  tabBtn: { padding: '0.6rem 1.4rem', border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: '#EDD87A', borderBottomColor: '#EDD87A', fontWeight: 600 },
  legalH: { fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.5rem', color: '#F0EDD8' },
  legalP: { fontSize: '0.92rem', color: '#ccc', marginBottom: '0.8rem', lineHeight: 1.7 },
  legalHighlight: { background: 'rgba(237,216,122,0.08)', border: '1px solid rgba(237,216,122,0.15)', borderRadius: 2, padding: '0.8rem 1rem', margin: '0.8rem 0', fontSize: '0.88rem', color: '#F0EDD8', fontWeight: 500 },
}