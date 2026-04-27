import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Hive({ user }) {
  const [profiles, setProfiles] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportMsg, setReportMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => { loadProfiles() }, [])

  async function loadProfiles() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .neq('email', user.email)
    if (data) setProfiles(data)
  }

  const filters = ['all','Study','Hang out','Find a buddy','Carpool','East LI','West LI','Stony Brook','NYC']

  const filtered = profiles.filter(p => {
    if (filter === 'all') return true
    return (p.looking_for || '').includes(filter) || p.area === filter
  })

  async function handleReport(reportedEmail) {
    if (!reportReason) return
    await supabase.from('reports').insert({
      reporter_email: user.email,
      reported_email: reportedEmail,
      reason: reportReason,
      message: reportMsg,
      created_at: new Date().toISOString()
    })
    setShowReport(false)
    setReportReason('')
    setReportMsg('')
    setSelected(null)
    alert('Report submitted. We will review it shortly.')
  }

  async function handleBlock(blockedEmail) {
    await supabase.from('blocks').insert({
      blocker_email: user.email,
      blocked_email: blockedEmail,
      created_at: new Date().toISOString()
    })
    setProfiles(profiles.filter(p => p.email !== blockedEmail))
    setSelected(null)
  }

  async function handlePayment() {
  try {
    const res = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  } catch(err) {
    alert('something went wrong. please try again.')
  }
}

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.logo}>yellow</button>
        <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
          {user.subscription_status === 'paid' && (
            <button style={s.msgBtn} onClick={() => navigate('/messages')}>messages</button>
          )}
          <span style={s.navEmail}>{user.email?.split('@')[0]}</span>
        </div>
      </nav>

      <div style={s.inner}>
        <div style={s.hiveHeader}>
          <h2 style={s.hiveTitle}>the hive. 🐝</h2>
          <p style={s.hiveSub}>SBU students looking to connect — browse free, upgrade when you're ready.</p>
        </div>

        <div style={s.filters}>
          {filters.map(f => (
            <button key={f}
              style={{...s.filterBtn, ...(filter === f ? s.filterActive : {})}}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div style={s.grid}>
          {filtered.length === 0 && (
            <p style={{color:'#888', fontSize:'0.9rem'}}>no profiles yet — be the first to join!</p>
          )}
          {filtered.map(p => (
            <div key={p.email} style={s.card} onClick={() => setSelected(p)}>
              <div style={s.cardTop}>
                <div style={s.cardAvatar}>
                  {p.photo_url
                    ? <img src={p.photo_url} alt="" style={s.avatarImg} />
                    : <span style={s.avatarInitial}>{p.email[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={s.cardName}>{p.email?.split('@')[0]}</div>
                  <div style={s.cardMajor}>{p.major} · {p.year}</div>
                </div>
              </div>

              {p.bio && <div style={s.cardBio}>"{p.bio}"</div>}

              {p.prompts && (() => {
                try {
                  return JSON.parse(p.prompts).slice(0,2).map((pr, i) => (
                    <div key={i} style={s.promptPreview}>
                      <div style={s.promptQ}>{pr.q}</div>
                      <div style={s.promptA}>{pr.a}</div>
                    </div>
                  ))
                } catch { return null }
              })()}

              <div style={s.cardTags}>
                {(p.looking_for || '').split(', ').filter(Boolean).map(t => (
                  <span key={t} style={s.tag}>{t}</span>
                ))}
              </div>

              <div style={s.cardFooter}>
                <span style={s.cardArea}>{p.area}</span>
                <button style={s.connectBtn} onClick={e => {
                  e.stopPropagation()
                  setSelected(p)
                  setShowPaywall(true)
                }}>Connect →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      {selected && !showPaywall && !showReport && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            <div style={s.modalTop}>
              <div style={s.modalAvatar}>
                {selected.photo_url
                  ? <img src={selected.photo_url} alt="" style={s.avatarImg} />
                  : <span style={s.avatarInitial}>{selected.email[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={s.modalName}>{selected.email?.split('@')[0]}</div>
                <div style={s.modalSub}>{selected.major} · {selected.year} · {selected.area}</div>
              </div>
            </div>

            {selected.bio && <p style={s.modalBio}>"{selected.bio}"</p>}

            {selected.prompts && (() => {
              try {
                return JSON.parse(selected.prompts).map((pr, i) => (
                  <div key={i} style={s.modalPrompt}>
                    <div style={s.modalPromptQ}>{pr.q}</div>
                    <div style={s.modalPromptA}>{pr.a}</div>
                  </div>
                ))
              } catch { return null }
            })()}

            <div style={s.modalActions}>
              <button style={s.connectBtnFull} onClick={() => setShowPaywall(true)}>Connect →</button>
              <button style={s.reportBtn} onClick={() => setShowReport(true)}>Report</button>
              <button style={s.blockBtn} onClick={() => handleBlock(selected.email)}>Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Paywall */}
      {showPaywall && selected && (
        <div style={s.overlay} onClick={() => setShowPaywall(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setShowPaywall(false)}>✕</button>
            <div style={s.paywallTag}>unlock messaging</div>
            <h3 style={s.paywallTitle}>connect securely with {selected.email?.split('@')[0]}.</h3>
            <ul style={s.reasonsList}>
              <li style={s.reason}><strong>no need to share your number</strong> — keep your personal info private</li>
              <li style={s.reason}><strong>SBU students only</strong> — verified university emails, no outsiders</li>
              <li style={s.reason}><strong>secure and private</strong> — your conversations stay within yellow</li>
              <li style={s.reason}><strong>cancel anytime</strong> — no long-term commitment</li>
            </ul>
            <div style={s.priceBox}>
              <div style={s.priceMain}>$1.99 first month</div>
              <div style={s.priceSub}>then $4.99/month · cancel anytime</div>
            </div>
            <button style={s.unlockBtn} onClick={() => handlePayment()}>unlock messaging →</button>
            <button style={s.dismissBtn} onClick={() => setShowPaywall(false)}>maybe later</button>
          </div>
        </div>
      )}

      {/* Report */}
      {showReport && selected && (
        <div style={s.overlay} onClick={() => setShowReport(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setShowReport(false)}>✕</button>
            <div style={s.paywallTag}>report account</div>
            <h3 style={s.paywallTitle}>report {selected.email?.split('@')[0]}</h3>
            <select style={s.reportSelect} value={reportReason} onChange={e => setReportReason(e.target.value)}>
              <option value="">select a reason</option>
              <option>Fake or suspicious profile</option>
              <option>Harassment or inappropriate behavior</option>
              <option>Explicit or offensive content</option>
              <option>Sharing personal contact info in bio</option>
              <option>Other</option>
            </select>
            <textarea style={s.reportInput}
              placeholder="tell us more (optional)..."
              value={reportMsg}
              onChange={e => setReportMsg(e.target.value)} />
            <button style={s.unlockBtn} onClick={() => handleReport(selected.email)}>submit report</button>
            <button style={s.dismissBtn} onClick={() => setShowReport(false)}>cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', width: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 100 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none' },
  navEmail: { fontSize: '0.78rem', color: '#888', fontFamily: 'Space Mono, monospace' },
  inner: { maxWidth: 1080, width: '100%', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 2rem) clamp(1rem, 4vw, 1.5rem) 4rem' },
  hiveHeader: { marginBottom: '2rem' },
  hiveTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', letterSpacing: '-0.03em', marginBottom: '0.3rem' },
  hiveSub: { fontSize: 'clamp(0.82rem, 2vw, 0.92rem)', color: '#888' },
  filters: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' },
  filterBtn: { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', color: '#888', padding: '0.4rem 0.9rem', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  filterActive: { background: '#EDD87A', borderColor: '#EDD87A', color: '#000', fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.2rem' },
  card: { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1.5rem', cursor: 'pointer' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.9rem' },
  cardAvatar: { width: 44, height: 44, borderRadius: '50%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: { fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: '#EDD87A' },
  cardName: { fontSize: '0.95rem', fontWeight: 600, color: '#F0EDD8' },
  cardMajor: { fontSize: '0.78rem', color: '#888', marginTop: '0.1rem' },
  cardBio: { fontSize: '0.83rem', color: '#ccc', lineHeight: 1.55, marginBottom: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  promptPreview: { background: '#141414', borderRadius: 2, padding: '0.6rem 0.8rem', marginBottom: '0.5rem' },
  promptQ: { fontSize: '0.7rem', color: '#EDD87A', fontFamily: 'Space Mono, monospace', marginBottom: '0.2rem' },
  promptA: { fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5 },
  cardTags: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.75rem 0' },
  tag: { display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 2, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(237,216,122,0.08)', color: '#EDD87A', border: '1px solid rgba(237,216,122,0.15)' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' },
  cardArea: { fontSize: '0.72rem', color: '#888', fontFamily: 'Space Mono, monospace' },
  connectBtn: { background: '#EDD87A', color: '#000', border: 'none', padding: '0.4rem 1rem', borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(8px)' },
  modal: { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, width: '100%', maxWidth: 420, padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: '1rem', right: '1.2rem', background: 'none', border: 'none', color: '#888', fontSize: '1.1rem', cursor: 'pointer' },
  modalTop: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  modalAvatar: { width: 52, height: 52, borderRadius: '50%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  modalName: { fontSize: '1rem', fontWeight: 600, color: '#F0EDD8' },
  modalSub: { fontSize: '0.78rem', color: '#888', marginTop: '0.1rem' },
  modalBio: { fontSize: '0.9rem', color: '#ccc', lineHeight: 1.6, marginBottom: '1rem', fontStyle: 'italic' },
  modalPrompt: { background: '#141414', borderRadius: 2, padding: '0.8rem', marginBottom: '0.6rem' },
  modalPromptQ: { fontSize: '0.7rem', color: '#EDD87A', fontFamily: 'Space Mono, monospace', marginBottom: '0.3rem' },
  modalPromptA: { fontSize: '0.9rem', color: '#ccc', lineHeight: 1.55 },
  modalActions: { display: 'flex', gap: '0.5rem', marginTop: '1.2rem' },
  connectBtnFull: { flex: 1, background: '#EDD87A', color: '#000', border: 'none', padding: '0.75rem', borderRadius: 2, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' },
  reportBtn: { background: 'transparent', color: '#888', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: 2, fontSize: '0.85rem', cursor: 'pointer' },
  blockBtn: { background: 'transparent', color: '#ff9999', border: '1px solid rgba(255,100,100,0.2)', padding: '0.75rem 1rem', borderRadius: 2, fontSize: '0.85rem', cursor: 'pointer' },
  paywallTag: { fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EDD87A', marginBottom: '1rem' },
  paywallTitle: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, fontStyle: 'italic', color: '#F0EDD8', marginBottom: '0.8rem', lineHeight: 1.1 },
  reasonsList: { listStyle: 'none', margin: '0 0 1.4rem', padding: 0 },
  reason: { fontSize: '0.9rem', color: '#ccc', padding: '0.5rem 0 0.5rem 1.2rem', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 },
  priceBox: { background: 'rgba(237,216,122,0.08)', border: '1px solid rgba(237,216,122,0.15)', borderRadius: 2, padding: '0.9rem 1rem', marginBottom: '1.2rem', textAlign: 'center' },
  priceMain: { fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 900, color: '#EDD87A' },
  priceSub: { fontSize: '0.78rem', color: '#888', marginTop: '0.2rem', fontFamily: 'Space Mono, monospace' },
  unlockBtn: { width: '100%', background: '#EDD87A', color: '#000', padding: '1rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '0.6rem' },
  dismissBtn: { width: '100%', background: 'transparent', color: '#888', padding: '0.6rem', borderRadius: 2, fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' },
  reportSelect: { width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.75rem 1rem', color: '#F0EDD8', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem' },
  reportInput: { width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.75rem 1rem', color: '#F0EDD8', fontSize: '0.9rem', outline: 'none', minHeight: 80, resize: 'vertical', fontFamily: 'DM Sans, sans-serif', marginBottom: '0.75rem' },
  msgBtn: { background: 'transparent', color: '#EDD87A', border: '1px solid rgba(237,216,122,0.3)', padding: '0.4rem 0.9rem', borderRadius: 2, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
}