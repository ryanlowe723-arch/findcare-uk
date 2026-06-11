import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(form.email, form.password)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'var(--surface-raised)' }}>
      <div style={{ width: '100%', maxWidth: 440, marginInline: 'auto', padding: 'var(--s-4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Practitioner Sign In
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Access your dashboard and manage your listing.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--s-3)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Not registered yet?{' '}
            <Link to="/register" style={{ color: 'var(--c-cobalt-700)', fontWeight: 600 }}>
              Join the directory
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
