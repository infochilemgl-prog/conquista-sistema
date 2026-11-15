import { useEffect, useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Captar from './pages/Captar'
import Login from './pages/Login'
import Pipeline from './pages/Pipeline'
import Contactos from './pages/Contactos'
import Calendario from './pages/Calendario'

const AuthContext = createContext({ session: null, loading: true })
export const useAuth = () => useContext(AuthContext)

function ProtectedLayout({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando…
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <Routes>
        <Route path="/captar" element={<Captar />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Pipeline />
            </ProtectedLayout>
          }
        />
        <Route
          path="/contactos"
          element={
            <ProtectedLayout>
              <Contactos />
            </ProtectedLayout>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedLayout>
              <Calendario />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}
