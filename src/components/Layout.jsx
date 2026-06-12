import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Heart } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/search', label: 'Find a Practitioner' },
  { to: '/symptom-checker', label: 'Symptom Checker' },
  { to: '/blog', label: 'Guides' },
  { to: '/faq', label: 'FAQ' },
]

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on navigation + scroll to top
  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

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

          {/* Desktop nav */}
          <nav className="dir-nav desktop-nav">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}>{l.label}</Link>
            ))}
            <Link to="/saved" aria-label="Saved practitioners" style={{ display: 'flex', alignItems: 'center' }}>
              <Heart size={17} />
            </Link>
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

          {/* Mobile burger */}
          <button
            className="mobile-burger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            style={{ display: 'none', color: 'var(--text-primary)' }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 'var(--header-h)', left: 0, right: 0,
              background: 'white', borderBottom: '1px solid var(--surface-border)',
              zIndex: 4999, padding: 'var(--s-3) var(--s-4) var(--s-4)',
              display: 'flex', flexDirection: 'column', gap: 4,
              boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
            }}
          >
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to} style={{ padding: '12px 4px', fontWeight: 500, fontSize: '0.95rem', borderBottom: '1px solid var(--surface-border)' }}>
                {l.label}
              </Link>
            ))}
            <Link to="/saved" style={{ padding: '12px 4px', fontWeight: 500, fontSize: '0.95rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={15} /> Saved
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" style={{ padding: '12px 4px', fontWeight: 500, fontSize: '0.95rem', borderBottom: '1px solid var(--surface-border)' }}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} style={{ padding: '12px 4px', fontWeight: 500, fontSize: '0.95rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ padding: '12px 4px', fontWeight: 500, fontSize: '0.95rem', borderBottom: '1px solid var(--surface-border)' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary" style={{ justifyContent: 'center', marginTop: 12 }}>
                  Join Directory
                </Link>
              </>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      <main>{children}</main>

      <footer className="dir-footer">
        <div style={{ maxWidth: 1280, marginInline: 'auto', paddingInline: 'var(--s-4)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--s-5)', paddingBottom: 'var(--s-5)',
            borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 'var(--s-3)',
          }}>
            <div>
              <div className="dir-footer-logo" style={{ marginBottom: 12 }}>FindCare UK</div>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.7, maxWidth: '30ch' }}>
                Find verified doctors, physios, and specialists near you — with real availability and honest reviews.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Patients</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <Link to="/search" style={{ color: 'rgba(255,255,255,0.6)' }}>Find a Practitioner</Link>
                <Link to="/symptom-checker" style={{ color: 'rgba(255,255,255,0.6)' }}>Symptom Checker</Link>
                <Link to="/saved" style={{ color: 'rgba(255,255,255,0.6)' }}>Saved Practitioners</Link>
                <Link to="/blog" style={{ color: 'rgba(255,255,255,0.6)' }}>Health Guides</Link>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Practitioners</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <Link to="/register" style={{ color: 'rgba(255,255,255,0.6)' }}>List Your Practice</Link>
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)' }}>Practitioner Sign In</Link>
                <Link to="/faq" style={{ color: 'rgba(255,255,255,0.6)' }}>FAQ</Link>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Legal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: 'rgba(255,255,255,0.6)' }}>Terms of Service</Link>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: '0.75rem' }}>
            <span>© 2026 FindCare UK. For informational purposes only — not medical advice.</span>
            <span>In an emergency, call 999.</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
