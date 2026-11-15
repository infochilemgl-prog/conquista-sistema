import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  ESTADOS_PROSPECTO,
  COLORES_ESTADO,
  META_DIARIA,
} from '../lib/ventas'

function inicioDia(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function Ventas() {
  const [prospectos, setProspectos] = useState([])
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const hace30 = new Date(Date.now() - 30 * 86400000).toISOString()
      const [pRes, aRes] = await Promise.all([
        supabase.from('prospectos').select('*'),
        supabase
          .from('actividades')
          .select('tipo, created_at')
          .gte('created_at', hace30),
      ])
      if (!pRes.error) setProspectos(pRes.data || [])
      if (!aRes.error) setActividades(aRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const contactos = actividades.filter(
    (a) => a.tipo === 'mensaje' || a.tipo === 'llamada'
  )
  const hoy0 = inicioDia()
  const semana0 = new Date(hoy0.getTime() - 6 * 86400000)
  const hoy = contactos.filter((a) => new Date(a.created_at) >= hoy0).length
  const semana = contactos.filter(
    (a) => new Date(a.created_at) >= semana0
  ).length
  const diasActivos = new Set(
    contactos
      .filter((a) => new Date(a.created_at) >= semana0)
      .map((a) => inicioDia(new Date(a.created_at)).toDateString())
  ).size

  const pct = Math.min(100, Math.round((hoy / META_DIARIA) * 100))

  const ahora = new Date()
  const llamadas = prospectos
    .filter((p) => p.llamada_fecha && new Date(p.llamada_fecha) >= ahora)
    .sort((a, b) => new Date(a.llamada_fecha) - new Date(b.llamada_fecha))
    .slice(0, 5)

  const hoyStr = hoy0.toISOString().slice(0, 10)
  const seguimientos = prospectos
    .filter(
      (p) =>
        p.proximo_seguimiento &&
        p.proximo_seguimiento <= hoyStr &&
        !['Cliente', 'Descartado'].includes(p.estado)
    )
    .sort((a, b) => a.proximo_seguimiento.localeCompare(b.proximo_seguimiento))

  const porEstado = ESTADOS_PROSPECTO.map((e) => ({
    estado: e,
    n: prospectos.filter((p) => p.estado === e).length,
  }))

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Cargando…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">Ventas</h1>
        <Link
          to="/prospectos"
          className="rounded-lg bg-sun px-4 py-2 text-sm font-bold text-navy hover:brightness-105"
        >
          Ir a prospectos →
        </Link>
      </div>

      {/* Contador de disciplina */}
      <div className="rounded-2xl bg-navy p-6 text-white shadow">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-300">
              Contactos reales enviados hoy
            </p>
            <p className="mt-1 text-5xl font-bold">
              {hoy}
              <span className="text-2xl font-semibold text-slate-400">
                {' '}
                / {META_DIARIA}
              </span>
            </p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>
              Esta semana: <span className="font-bold text-white">{semana}</span>
            </p>
            <p>
              Días activos (últ. 7):{' '}
              <span className="font-bold text-white">{diasActivos}/7</span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 100 ? 'bg-green-400' : 'bg-sun'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-300">
          {hoy === 0
            ? 'Cero. El manual lo dice: lo único entre NexoSolar y su primer peso son mensajes enviados a instaladores.'
            : pct >= 100
              ? 'Meta cumplida. Esto es lo que separa al 1% del resto.'
              : `Te faltan ${META_DIARIA - hoy} para la meta. Un mensaje por WhatsApp desde Prospectos cuenta solo.`}
        </p>
      </div>

      {/* Pipeline resumen */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Pipeline de instaladores
        </h2>
        <div className="flex flex-wrap gap-2">
          {porEstado.map(({ estado, n }) => (
            <Link
              key={estado}
              to={`/prospectos?estado=${encodeURIComponent(estado)}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium hover:opacity-80 ${COLORES_ESTADO[estado]}`}
            >
              {estado}: <span className="font-bold">{n}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximas llamadas */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Próximas llamadas
          </h2>
          {llamadas.length === 0 ? (
            <p className="text-sm text-slate-400">
              Nada agendado. Las llamadas salen del volumen de mensajes.
            </p>
          ) : (
            <ul className="space-y-2">
              {llamadas.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-navy">
                    {p.nombre_empresa}
                  </span>
                  <span className="text-slate-500">
                    {new Date(p.llamada_fecha).toLocaleString('es-CL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Seguimientos pendientes */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Seguimientos para hoy
          </h2>
          {seguimientos.length === 0 ? (
            <p className="text-sm text-slate-400">Sin seguimientos vencidos.</p>
          ) : (
            <ul className="space-y-2">
              {seguimientos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-sun/10 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-navy">
                    {p.nombre_empresa}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${COLORES_ESTADO[p.estado]}`}
                  >
                    {p.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
