import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import './index.css'

const Home                = lazy(() => import('./pages/Home'))
const Search              = lazy(() => import('./pages/Search'))
const PractitionerProfile = lazy(() => import('./pages/PractitionerProfile'))
const SymptomChecker      = lazy(() => import('./pages/SymptomChecker'))
const Favourites          = lazy(() => import('./pages/Favourites'))
const Blog                = lazy(() => import('./pages/Blog'))
const BlogPost            = lazy(() => import('./pages/BlogPost'))
const Faq                 = lazy(() => import('./pages/Faq'))
const Register            = lazy(() => import('./pages/Register'))
const Login               = lazy(() => import('./pages/Login'))
const Dashboard           = lazy(() => import('./pages/Dashboard'))
const Admin               = lazy(() => import('./pages/Admin'))
const CancelBooking       = lazy(() => import('./pages/CancelBooking'))
const Privacy             = lazy(() => import('./pages/Privacy'))
const Terms               = lazy(() => import('./pages/Terms'))
const NotFound            = lazy(() => import('./pages/NotFound'))

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  const isAdmin = user?.user_metadata?.role === 'admin'
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-data)',
      fontSize: '0.8rem',
      letterSpacing: '0.1em',
    }}>
      LOADING...
    </div>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui', padding: '2rem', textAlign: 'center',
          background: '#f8fafc',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', maxWidth: '40ch' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/practitioners/:id" element={<PractitionerProfile />} />
          <Route path="/symptom-checker"   element={<SymptomChecker />} />
          <Route path="/saved"             element={<Favourites />} />
          <Route path="/blog"              element={<Blog />} />
          <Route path="/blog/:slug"        element={<BlogPost />} />
          <Route path="/faq"               element={<Faq />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/cancel-booking"    element={<CancelBooking />} />
          <Route path="/privacy"           element={<Privacy />} />
          <Route path="/terms"             element={<Terms />} />
          <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin"             element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*"                  element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
