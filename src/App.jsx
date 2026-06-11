import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import './index.css'

const Home                = lazy(() => import('./pages/Home'))
const Search              = lazy(() => import('./pages/Search'))
const PractitionerProfile = lazy(() => import('./pages/PractitionerProfile'))
const Register            = lazy(() => import('./pages/Register'))
const Login               = lazy(() => import('./pages/Login'))
const Dashboard           = lazy(() => import('./pages/Dashboard'))
const Admin               = lazy(() => import('./pages/Admin'))

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

function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                  element={<Home />} />
          <Route path="/search"            element={<Search />} />
          <Route path="/practitioners/:id" element={<PractitionerProfile />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/dashboard"         element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin"             element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
