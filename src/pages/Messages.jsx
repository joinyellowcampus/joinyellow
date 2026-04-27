import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Messages({ user }) {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.email) { navigate('/'); return }
    if (user.subscription_status !== 'paid') { navigate('/hive'); return }
    loadConversations()
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages(selected)
    const sub = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_email=eq.${user.email}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        scrollToBottom()
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [selected])

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadConversations() {
    const { data: sent } = await supabase
      .from('messages')
      .select('receiver_email')
      .eq('sender_email', user.email)

    const { data: received } = await supabase
      .from('messages')
      .select('sender_email')
      .eq('receiver_email', user.email)

    const emails = new Set([
      ...(sent || []).map(m => m.receiver_email),
      ...(received || []).map(m => m.sender_email)
    ])

    const { data: profiles } = await supabase
      .from('users')
      .select('*')
      .in('email', [...emails])

    setConversations(profiles || [])
  }

  async function loadMessages(otherEmail) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_email.eq.${user.email},receiver_email.eq.${otherEmail}),and(sender_email.eq.${otherEmail},receiver_email.eq.${user.email})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    // Mark as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_email', user.email)
      .eq('sender_email', otherEmail)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim() || !selected) return
    setLoading(true)

    const msg = {
      sender_email: user.email,
      receiver_email: selected,
      content: newMsg.trim(),
      created_at: new Date().toISOString()
    }

    await supabase.from('messages').insert(msg)
    setMessages(prev => [...prev, msg])
    setNewMsg('')
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.logo} onClick={() => navigate('/hive')}>yellow</button>
        <span style={s.navLabel}>messages</span>
      </nav>

      <div style={s.layout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>conversations</div>
          {conversations.length === 0 && (
            <p style={s.empty}>no conversations yet. connect with someone in the hive!</p>
          )}
          {conversations.map(p => (
            <div key={p.email}
              style={{...s.convo, ...(selected === p.email ? s.convoActive : {})}}
              onClick={() => setSelected(p.email)}>
              <div style={s.convoAvatar}>
                {p.photo_url
                  ? <img src={p.photo_url} alt="" style={s.avatarImg} />
                  : <span style={s.avatarInitial}>{p.email[0]?.toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={s.convoName}>{p.email?.split('@')[0]}</div>
                <div style={s.convoSub}>{p.major} · {p.area}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div style={s.chat}>
          {!selected && (
            <div style={s.noChat}>
              <div style={s.noChatEmoji}>🐝</div>
              <p style={s.noChatText}>select a conversation to start messaging</p>
            </div>
          )}

          {selected && (
            <>
              <div style={s.chatMessages}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    ...s.message,
                    ...(m.sender_email === user.email ? s.messageSent : s.messageReceived)
                  }}>
                    <div style={{
                      ...s.messageBubble,
                      ...(m.sender_email === user.email ? s.bubbleSent : s.bubbleReceived)
                    }}>
                      {m.content}
                    </div>
                    <div style={s.messageTime}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} style={s.chatInput}>
                <input
                  style={s.msgInput}
                  placeholder="type a message..."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  required
                />
                <button type="submit" style={s.sendBtn} disabled={loading}>→</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', color: '#F0EDD8', width: '100%', display: 'flex', flexDirection: 'column' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(1rem, 3vw, 1.4rem) clamp(1.2rem, 5vw, 2.5rem)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 },
  logo: { fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 900, fontStyle: 'italic', color: '#EDD87A', background: 'none', border: 'none', cursor: 'pointer' },
  navLabel: { fontFamily: 'Space Mono, monospace', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888' },
  layout: { display: 'flex', flex: 1, height: 'calc(100vh - 60px)' },
  sidebar: { width: 280, borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 },
  sidebarHeader: { fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', padding: '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  empty: { fontSize: '0.85rem', color: '#555', padding: '1.5rem 1.2rem', lineHeight: 1.6 },
  convo: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.2rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  convoActive: { background: 'rgba(237,216,122,0.08)' },
  convoAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: { fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: '#EDD87A' },
  convoName: { fontSize: '0.9rem', fontWeight: 600, color: '#F0EDD8' },
  convoSub: { fontSize: '0.72rem', color: '#888', marginTop: '0.1rem' },
  chat: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' },
  noChatEmoji: { fontSize: '3rem' },
  noChatText: { fontSize: '0.9rem', color: '#555', fontFamily: 'Space Mono, monospace' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  message: { display: 'flex', flexDirection: 'column', maxWidth: '70%' },
  messageSent: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageReceived: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageBubble: { padding: '0.75rem 1rem', borderRadius: 4, fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '100%', wordBreak: 'break-word' },
  bubbleSent: { background: '#EDD87A', color: '#000' },
  bubbleReceived: { background: '#141414', color: '#F0EDD8', border: '1px solid rgba(255,255,255,0.08)' },
  messageTime: { fontSize: '0.65rem', color: '#555', fontFamily: 'Space Mono, monospace', marginTop: '0.2rem' },
  chatInput: { display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#000' },
  msgInput: { flex: 1, background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2, padding: '0.75rem 1rem', color: '#F0EDD8', fontSize: '0.95rem', outline: 'none', fontFamily: 'DM Sans, sans-serif' },
  sendBtn: { background: '#EDD87A', color: '#000', border: 'none', padding: '0.75rem 1.2rem', borderRadius: 2, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' },
}