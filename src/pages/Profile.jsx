import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PROMPTS = [
  "My go-to spot on campus is...",
  "You'll always find me at...",
  "My biggest SBU complaint is...",
  "The best thing about commuting is...",
  "My typical day at SBU looks like...",
  "Hot take:",
  "People would describe me as...",
  "I'm weirdly passionate about...",
  "My most controversial opinion is...",
  "I laugh way too hard at...",
  "The way to get me talking is...",
  "My go-to food order is...",
  "I will always say yes to...",
  "My comfort show/movie is...",
  "Currently obsessed with...",
  "Unpopular opinion about food:",
  "My love language is...",
  "I'm looking for someone who...",
  "Best conversation starter with me:",
  "We'd get along if you...",
  "I'm studying because...",
  "In 5 years I'll be...",
  "I chose SBU because...",
  "Ask me about...",
]

export default function Profile({ email, setUser }) {
  const [step, setStep] = useState(1)
  const [major, setMajor] = useState('')
  const [year, setYear] = useState('')
  const [area, setArea] = useState('')
  const [lookingFor, setLookingFor] = useState([])
  const [where, setWhere] = useState([])
  const [bio, setBio] = useState('')
  const [prompts, setPrompts] = useState([{ q: '', a: '' }, { q: '', a: '' }])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  function updatePrompt(i, field, val) {
    const updated = [...prompts]
    updated[i][field] = val
    setPrompts(updated)
  }

  function addPrompt() {
    if (prompts.length < 5) setPrompts([...prompts, { q: '', a: '' }])
  }

  function removePrompt(i) {
    if (prompts.length > 2) setPrompts(prompts.filter((_, idx) => idx !== i))
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!major || !year || !area) { setError('please fill in major, year, and area.'); return }
    const filledPrompts = prompts.filter(p => p.q && p.a)
    if (filledPrompts.length < 2) { setError('please answer at least 2 prompts.'); return }

    setLoading(true)
    setError('')

    let photoUrl = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${email}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, photo)
      if (!uploadErr) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
    }

    const userData = {
      email, major, year, area,
      looking_for: lookingFor.join(', '),
      where_pref: where.join(', '),
      bio,
      prompts: JSON.stringify(filledPrompts),
      photo_url: photoUrl,
      subscription_status: 'free',
      created_at: new Date().toISOString()
    }

    const { error: insertErr } = await supabase.from('users').upsert(userData)

    if (insertErr) {
      setError('something went wrong. please try again.')
      setLoading(false)
      return
    }

    setUser(userData)
    setLoading(false)
    navigate('/hive')
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.logo}>yellow</button>
        <div style={s.steps}>
          <div style={{...s.dot, ...(step >= 1 ? s.dotActive : {})}} />
          <div style={{...s.dot, ...(step >= 2 ? s.dotActive : {})}} />
        </div>
      </nav>

      <form onSubmit={handleSubmit} style={s.inner}>
        {step === 1 && (
          <>
            <div style={s.label}>your profile</div>
            <h2 style={s.title}>tell us about you.</h2>
            <p style={s.sub}>this is what other SBU students will see.</p>

            <div style={s.photoWrap}>
              <div style={s.avatar}>
                {photoPreview
                  ? <img src={photoPreview} alt="preview" style={s.avatarImg} />
                  : <span style={s.avatarInitial}>{email[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={s.photoLabel}>profile photo — optional</div>
                <label style={s.photoBtn} htmlFor="photo">upload photo</label>
                <input type="file" id="photo" accept="image/*" style={{display:'none'}} onChange={handlePhoto} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.fieldLabel}>Major</label>
              <input style={s.input} placeholder="e.g. Psychology" value={major} onChange={e => setMajor(e.target.value)} required />
            </div>

            <div style={s.fieldRow}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Year</label>
                <select style={s.input} value={year} onChange={e => setYear(e.target.value)} required>
                  <option value="">Select</option>
                  <optgroup label="Undergraduate">
                    <option>Freshman</option>
                    <option>Sophomore</option>
                    <option>Junior</option>
                    <option>Senior</option>
                  </optgroup>
                  <optgroup label="Graduate">
                    <option>Grad — First Year</option>
                    <option>Grad — Second Year</option>
                    <option>Grad — Third Year+</option>
                    <option>PhD Student</option>
                    <option>Grad Student</option>
                  </optgroup>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Area</label>
                <select style={s.input} value={area} onChange={e => setArea(e.target.value)} required>
                  <option value="">Select</option>
                  <option>East LI</option>
                  <option>West LI</option>
                  <option>Stony Brook</option>
                  <option>NYC</option>
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.fieldLabel}>I'm looking to</label>
              <div style={s.toggleRow}>
                {['Study','Hang out','Find a buddy','Carpool'].map(v => (
                  <button key={v} type="button"
                    style={{...s.toggle, ...(lookingFor.includes(v) ? s.toggleActive : {})}}
                    onClick={() => toggleArr(lookingFor, setLookingFor, v)}>{v}</button>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.fieldLabel}>Where</label>
              <div style={s.toggleRow}>
                {['On campus','Off campus'].map(v => (
                  <button key={v} type="button"
                    style={{...s.toggle, ...(where.includes(v) ? s.toggleActive : {})}}
                    onClick={() => toggleArr(where, setWhere, v)}>{v}</button>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.fieldLabel}>Bio</label>
              <textarea style={{...s.input, minHeight: 80, resize: 'vertical'}}
                placeholder="e.g. Looking for someone on the Port Jeff line on Tuesdays..."
                value={bio} onChange={e => setBio(e.target.value)} />
            </div>

            <button type="button" style={s.btn} onClick={() => setStep(2)}>next →</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={s.label}>prompts</div>
            <h2 style={s.title}>let them get to know you.</h2>
            <p style={s.sub}>answer at least 2, up to 5. pick questions that feel like you.</p>

            {prompts.map((p, i) => (
              <div key={i} style={s.promptCard}>
                <div style={s.promptTop}>
                  <select style={s.promptSelect} value={p.q}
                    onChange={e => updatePrompt(i, 'q', e.target.value)}>
                    <option value="">pick a prompt...</option>
                    {PROMPTS.map((q, j) => <option key={j} value={q}>{q}</option>)}
                  </select>
                  {prompts.length > 2 && (
                    <button type="button" style={s.removeBtn} onClick={() => removePrompt(i)}>✕</button>
                  )}
                </div>
                <textarea style={s.promptAnswer}
                  placeholder="your answer..."
                  value={p.a}
                  onChange={e => updatePrompt(i, 'a', e.target.value)}
                  maxLength={150} />
                <div style={s.charCount}>{p.a.length}/150</div>
              </div>
            ))}

            {prompts.length < 5 && (
              <button type="button" style={s.addPromptBtn} onClick={addPrompt}>+ add another prompt</button>
            )}

            {error && <p style={s.error}>{error}</p>}

            <div style={s.btnRow}>
              <button type="button" style={s.backBtn} onClick={() => setStep(1)}>← back</button>
              <button type="submit" style={s.btn} disabled={loading}>
                {loading ? 'joining...' : 'join yellow →'}
              </button>
            </div>

            <p style={s.note}>free to join · upgrade only when you want to connect</p>
          </>
        )}
      </form>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', width: '100%' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none' },
  steps: { display: 'flex', gap: '0.5rem' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' },
  dotActive: { background: '#EDD87A' },
  inner: { maxWidth: 480, width: '100%', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 1.5rem) 6rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#EDD87A' },
  title: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, fontStyle: 'italic', color: '#F0EDD8' },
  sub: { fontSize: 'clamp(0.85rem, 2vw, 0.92rem)', color: '#888', lineHeight: 1.6 },
  photoWrap: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: { fontFamily: 'Fraunces, serif', fontSize: '1.3rem', fontWeight: 700, color: '#EDD87A' },
  photoLabel: { fontSize: '0.65rem', color: '#666', fontFamily: 'Space Mono, monospace', marginBottom: 4 },
  photoBtn: { fontSize: '0.8rem', color: '#888', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem 0.8rem', cursor: 'pointer', display: 'inline-block' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  fieldRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' },
  fieldLabel: { fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' },
  input: { background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.85rem 1rem', color: '#F0EDD8', fontSize: '1rem', outline: 'none', width: '100%' },
  toggleRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  toggle: { padding: '0.45rem 1rem', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', background: '#141414', color: '#888', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  toggleActive: { background: '#EDD87A', borderColor: '#EDD87A', color: '#000', fontWeight: 700 },
  btn: { background: '#EDD87A', color: '#000', padding: '1rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer', width: '100%' },
  backBtn: { background: 'transparent', color: '#888', padding: '1rem', borderRadius: 2, fontSize: '1rem', fontWeight: 500, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', flex: 1 },
  btnRow: { display: 'flex', gap: '0.75rem' },
  note: { fontSize: '0.7rem', color: '#666', fontFamily: 'Space Mono, monospace', textAlign: 'center' },
  error: { color: '#ff9999', fontSize: '0.78rem', fontFamily: 'Space Mono, monospace' },
  promptCard: { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  promptTop: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  promptSelect: { flex: 1, background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.6rem 0.8rem', color: '#F0EDD8', fontSize: '0.88rem', outline: 'none' },
  promptAnswer: { background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.6rem 0.8rem', color: '#F0EDD8', fontSize: '0.9rem', outline: 'none', resize: 'vertical', minHeight: 60, fontFamily: 'DM Sans, sans-serif' },
  charCount: { fontSize: '0.65rem', color: '#555', fontFamily: 'Space Mono, monospace', textAlign: 'right' },
  removeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem 0.4rem' },
  addPromptBtn: { background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', color: '#666', padding: '0.75rem', borderRadius: 2, cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'DM Sans, sans-serif' },
}