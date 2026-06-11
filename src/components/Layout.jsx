import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <header className="dir-header">
        <div className="dir-header-inner">
          <Link to="/" className="dir-logo">
            Find<span>Care</span> UK
          </Link>

          <nav className="dir-nav">
            <Link to="/search">Find a Practitioner</Link>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button
                  onClick={handleSignOut}
                  style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Sign In</Link>
                <Link to="/register" className="btn-primary">
                  Join Directory
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="dir-footer">
        <div className="dir-footer-inner">
          <span className="dir-footer-logo">FindCare UK</span>
          <span>© 2026 FindCare UK. For informational purposes only.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/register" style={{ color: 'rgba(255,255,255,0.6)' }}>List Your Practice</Link>
            <Link to="/search" style={{ color: 'rgba(255,255,255,0.6)' }}>Find a Practitioner</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
