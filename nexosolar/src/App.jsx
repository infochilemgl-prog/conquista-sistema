import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { AppContext, useApp } from './context/app'
import Layout from './components/Layout'
import Captar from './pages/Captar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Oportunidades from './pages/Oportunidades'
import Conversaciones from './pages/Conversaciones'
import Contactos from './pages/Contactos'
import Calendario from './pages/Calendario'
import Ventas from './pages/Ventas'
import Prospectos from './pages/Prospectos'

function Privada({ children }) {
  const { session, loading } = useApp()
  const location = useLocation()
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando…</div>
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Layout>{children}</Layout>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cliente, setCliente] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setPerfil(null)
      setClientes([])
      setCliente(null)
      return
    }
    ;(async () => {
      try {
        const { data: p } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        // Sin fila de perfil: opera como owner para no bloquear el arranque
        const perfilFinal = p || { id: session.user.id, nombre: session.user.email, rol: 'owner', cliente_id: null }
        setPerfil(perfilFinal)
        if (perfilFinal.rol === 'owner') {
          const { data: cs } = await supabase.from('clientes').select('*').order('created_at')
          setClientes(cs || [])
          const guardado = localStorage.getItem('nv_cliente')
          setCliente((cs || []).find((c) => c.id === guardado) || (cs || [])[0] || null)
        } else {
          const { data: c } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', perfilFinal.cliente_id)
            .maybeSingle()
          setClientes(c ? [c] : [])
          setCliente(c || null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [session])

  function elegirCliente(c) {
    setCliente(c)
    try {
      localStorage.setItem('nv_cliente', c?.id || '')
    } catch (e) { /* almacenamiento no disponible */ }
  }

  const ctx = {
    session,
    loading,
    perfil,
    clientes,
    cliente,
    setCliente: elegirCliente,
    esOwner: perfil?.rol === 'owner',
  }

  return (
    <AppContext.Provider value={ctx}>
      <Routes>
        <Route path="/captar/:slug" element={<Captar />} />
        <Route path="/captar" element={<Captar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Privada><Dashboard /></Privada>} />
        <Route path="/oportunidades" element={<Privada><Oportunidades /></Privada>} />
        <Route path="/conversaciones" element={<Privada><Conversaciones /></Privada>} />
        <Route path="/contactos" element={<Privada><Contactos /></Privada>} />
        <Route path="/calendario" element={<Privada><Calendario /></Privada>} />
        <Route path="/ventas" element={<Privada><Ventas /></Privada>} />
        <Route path="/prospectos" element={<Privada><Prospectos /></Privada>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  )
}
