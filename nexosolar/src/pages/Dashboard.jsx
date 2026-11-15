import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import { formatCLP, waLink } from '../lib/labels'

const RANGOS = [
  { id: '7', label: '7 días', dias: 7 },
  { id: '30', label: '30 días', dias: 30 },
  { id: '90', label: '90 días', dias: 90 },
  { id: 'todo', label: 'Todo', dias: null },
]

function Card({ label, valor, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{valor}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { cliente } = useApp()
  const [rango, setRango] = useState('30')
  const [leads, setLeads] = useState([])
  const [citas, setCitas] = useState([])
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cliente) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  async function load() {
    try {
      const [lRes, cRes, tRes] = await Promise.all([
        supabase.from('leads').select('id, estado, valor_estimado, created_at').eq('cliente_id', cliente.id),
        supabase.from('citas').select('id, fecha').eq('cliente_id', cliente.id),
        supabase
          .from('tareas_automaticas')
          .select('*, leads(id, nombre, telefono)')
          .eq('cliente_id', cliente.id)
          .eq('estado', 'pendiente')
          .lte('programada_para', new Date().toISOString())
          .order('programada_para'),
      ])
      if (!lRes.error) setLeads(lRes.data || [])
      if (!cRes.error) setCitas(cRes.data || [])
      if (!tRes.error) setTareas(tRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const dias = RANGOS.find((r) => r.id === rango)?.dias
  const desde = dias ? new Date(Date.now() - dias * 86400000) : null
  const enRango = (f) => !desde || new Date(f) >= desde
  const leadsR = leads.filter((l) => enRango(l.created_at))
  const citasR = citas.filter((c) => enRango(c.fecha))
  const ganados = leadsR.filter((l) => l.estado === 'Trabajo ganado')
  const valorPipeline = leadsR
    .filter((l) => l.estado !== 'Trabajo ganado')
    .reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0)
  const valorGanado = ganados.reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0)

  async function enviarTarea(t) {
    if (!t.leads) return
    window.open(waLink(t.leads.telefono, t.payload || ''), '_blank')
    await supabase.from('tareas_automaticas').update({ estado: 'enviada' }).eq('id', t.id)
    await supabase.from('mensajes').insert({
      lead_id: t.lead_id,
      cliente_id: cliente.id,
      direccion: 'out',
      canal: t.canal || 'whatsapp',
      texto: t.payload || '',
      enviado_por: 'auto',
    })
    setTareas((xs) => xs.filter((x) => x.id !== t.id))
  }

  if (!cliente) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No hay ningún cliente (instalador) creado todavía. Corre el seed en
        Supabase o crea uno en la tabla <code>clientes</code>.
      </p>
    )
  }
  if (loading) return <p className="py-10 text-center text-slate-500">Cargando…</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-navy">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRango(r.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                rango === r.id ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Leads" valor={leadsR.length} />
        <Card label="Citas agendadas" valor={citasR.length} />
        <Card label="Trabajos ganados" valor={ganados.length} sub={formatCLP(valorGanado)} />
        <Card label="Valor en pipeline" valor={formatCLP(valorPipeline)} />
      </div>

      {/* Motor semi-automático: tareas vencidas listas para enviar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Mensajes por enviar
          </h2>
          <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-navy">
            {tareas.length}
          </span>
        </div>
        {tareas.length === 0 ? (
          <p className="text-sm text-slate-400">
            Nada pendiente. Las automatizaciones crean mensajes acá cuando
            entra un lead o se acerca una cita.
          </p>
        ) : (
          <ul className="space-y-2">
            {tareas.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">
                    {t.leads?.nombre || 'Lead'}{' '}
                    <span className="ml-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
                      {t.tipo}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-500">{t.payload}</p>
                </div>
                <button
                  onClick={() => enviarTarea(t)}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                >
                  💬 Enviar ahora
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
