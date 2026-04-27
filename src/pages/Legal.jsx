import { useNavigate } from 'react-router-dom'

export default function Legal() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#F0EDD8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#888', marginBottom: '1rem' }}>redirecting...</p>
        <button onClick={() => navigate('/')} style={{ background: '#EDD87A', color: '#000', border: 'none', padding: '0.75rem 2rem', cursor: 'pointer', fontWeight: 700 }}>go home</button>
      </div>
    </div>
  )
}