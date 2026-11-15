import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'

function Logo() {
  return (
    <div className="leading-tight">
      <div className="text-lg font-extrabold tracking-tight">
        <span className="text-white">Nexo</span>
        <span className="text-brand">Volt</span>
        <span className="ml-1 text-sun">⚡</span>
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
        Leads
      </div>
    </div>
  )
}

function NavItems({ onNavigate }) {
  const { esOwner } = useApp()
  const items = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/oportunidades', icon: '🧲', label: 'Oportunidades' },
    { to: '/conversaciones', icon: '💬', label: 'Conversaciones' },
    { to: '/contactos', icon: '👥', label: 'Contactos' },
    { to: '/calendario', icon: '📅', label: 'Calendario' },
  ]
  const agencia = [
    { to: '/ventas', icon: '🎯', label: 'Ventas (agencia)' },
    { to: '/prospectos', icon: '🏗️', label: 'Prospectos' },
  ]
  const cls = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10'
    }`
  return (
    <nav className="space-y-1">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} className={cls} onClick={onNavigate}>
          <span>{i.icon}</span> {i.label}
        </NavLink>
      ))}
      {esOwner && (
        <>
          <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Agencia
          </p>
          {agencia.map((i) => (
            <NavLink key={i.to} to={i.to} className={cls} onClick={onNavigate}>
              <span>{i.icon}</span> {i.label}
            </NavLink>
          ))}
        </>
      )}
    </nav>
  )
}

function SelectorCliente() {
  const { esOwner, clientes, cliente, setCliente } = useApp()
  if (!esOwner || clientes.length < 2) return null
  return (
    <select
      value={cliente?.id || ''}
      onChange={(e) =>
        setCliente(clientes.find((c) => c.id === e.target.value))
      }
      className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-xs text-white"
    >
      {clientes.map((c) => (
        <option key={c.id} value={c.id} className="text-slate-900">
          {c.nombre_empresa}
        </option>
      ))}
    </select>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { perfil, cliente } = useApp()
  const navigate = useNavigate()

  async function salir() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-fondo text-ink">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-navy p-4 md:flex">
        <Logo />
        <SelectorCliente />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavItems />
        </div>
        <div className="border-t border-white/10 pt-3 text-xs text-slate-400">
          <p className="truncate">{perfil?.nombre || 'Usuario'}</p>
          {cliente && <p className="truncate text-slate-500">{cliente.nombre_empresa}</p>}
          <button onClick={salir} className="mt-2 text-slate-300 hover:text-white">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra móvil */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="rounded p-2 text-white"
          aria-label="Abrir menú"
        >
          ☰
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="h-full w-64 bg-navy p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="p-2 text-white">✕</button>
            </div>
            <SelectorCliente />
            <div className="mt-4">
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
            <button onClick={salir} className="mt-6 text-sm text-slate-300">
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <main className="px-4 py-5 md:ml-56 md:px-6">{children}</main>
    </div>
  )
}
