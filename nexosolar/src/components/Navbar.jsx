import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const links = [
  { to: '/ventas', label: 'Ventas' },
  { to: '/prospectos', label: 'Prospectos' },
  { to: '/', label: 'Pipeline' },
  { to: '/contactos', label: 'Contactos' },
  { to: '/calendario', label: 'Calendario' },
]

export default function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-navy text-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="text-lg font-bold tracking-tight">
            Nexo<span className="text-sun">Solar</span>
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded px-2 py-1.5 text-sm font-medium sm:px-3 ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 rounded px-2 py-1.5 text-sm text-slate-300 hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}
