import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import { tareasCita } from '../lib/plantillas'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORA_INICIO = 8
const HORA_FIN = 20

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const inicioSemana = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

function MiniMes({ fechaRef, onPick }) {
  const [mes, setMes] = useState(new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1))
  const celdas = useMemo(() => {
    const y = mes.getFullYear(), m = mes.getMonth()
    const offset = (new Date(y, m, 1).getDay() + 6) % 7
    const n = new Date(y, m + 1, 0).getDate()
    const out = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= n; d++) out.push(new Date(y, m, d))
    return out
  }, [mes])
  const hoy = dayKey(new Date())
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="px-1 text-slate-400 hover:text-navy">←</button>
        <p className="font-semibold capitalize text-navy">
          {mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="px-1 text-slate-400 hover:text-navy">→</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-slate-400">
        {DIAS.map((d) => <div key={d}>{d[0]}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center">
        {celdas.map((f, i) =>
          f ? (
            <button
              key={i}
              onClick={() => onPick(f)}
              className={`rounded py-1 hover:bg-brand/10 ${
                dayKey(f) === dayKey(fechaRef)
                  ? 'bg-brand font-bold text-white hover:bg-brand'
                  : dayKey(f) === hoy
                    ? 'font-bold text-brand'
                    : 'text-slate-600'
              }`}
            >
              {f.getDate()}
            </button>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </div>
  )
}

function CitaBloque({ cita, compact = false }) {
  const f = new Date(cita.fecha)
  return (
    <div
      title={cita.notas || ''}
      className={`truncate rounded bg-brand px-1.5 text-white ${compact ? 'py-0.5 text-[10px]' : 'py-1 text-xs'}`}
    >
      {f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}{' '}
      {cita.leads?.nombre || 'Cita'}
    </div>
  )
}

function NuevaCitaModal({ clienteId, empresa, leads, fechaInicial, onClose, onCreated }) {
  const [leadId, setLeadId] = useState('')
  const [fecha, setFecha] = useState(fechaInicial || '')
  const [hora, setHora] = useState('10:00')
  const [notas, setNotas] = useState('Visita técnica — evaluación de ahorro')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!leadId || !fecha || !hora) {
      setError('Selecciona lead, fecha y hora.')
      return
    }
    setSaving(true)
    const lead = leads.find((l) => l.id === leadId)
    const fechaISO = new Date(`${fecha}T${hora}`).toISOString()
    const { error: err } = await supabase.from('citas').insert({
      cliente_id: clienteId,
      lead_id: leadId,
      fecha: fechaISO,
      notas: notas || null,
    })
    if (!err) {
      await supabase.from('leads').update({ estado: 'Cita agendada' }).eq('id', leadId)
      // Confirmación inmediata + recordatorios 8h y 1h antes
      await supabase
        .from('tareas_automaticas')
        .insert(tareasCita(lead, clienteId, empresa, new Date(`${fecha}T${hora}`)))
    }
    setSaving(false)
    if (err) {
      setError('No se pudo crear la cita.')
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-bold text-navy">Nueva cita</h2>
        <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Selecciona un lead…</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>{l.nombre}{l.comuna ? ` · ${l.comuna}` : ''}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <input value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-400">
          Automático por WhatsApp: confirmación al agendar y recordatorios 8 h
          y 1 h antes de la visita.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Guardando…' : 'Crear cita'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Calendario() {
  const { cliente } = useApp()
  const [vista, setVista] = useState('semana')
  const [fechaRef, setFechaRef] = useState(new Date())
  const [citas, setCitas] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    if (cliente) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  async function load() {
    try {
      const [cRes, lRes] = await Promise.all([
        supabase.from('citas').select('*, leads(nombre, telefono, comuna)').eq('cliente_id', cliente.id).order('fecha'),
        supabase.from('leads').select('id, nombre, comuna').eq('cliente_id', cliente.id).order('nombre'),
      ])
      if (!cRes.error) setCitas(cRes.data || [])
      if (!lRes.error) setLeads(lRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const citasPorDia = useMemo(() => {
    const map = {}
    for (const c of citas) (map[dayKey(new Date(c.fecha))] ||= []).push(c)
    return map
  }, [citas])

  const semana = useMemo(() => {
    const ini = inicioSemana(fechaRef)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ini)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [fechaRef])

  const celdasMes = useMemo(() => {
    const y = fechaRef.getFullYear(), m = fechaRef.getMonth()
    const offset = (new Date(y, m, 1).getDay() + 6) % 7
    const n = new Date(y, m + 1, 0).getDate()
    const out = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= n; d++) out.push(new Date(y, m, d))
    return out
  }, [fechaRef])

  const hoyKey = dayKey(new Date())

  function mover(delta) {
    const d = new Date(fechaRef)
    if (vista === 'dia') d.setDate(d.getDate() + delta)
    else if (vista === 'semana') d.setDate(d.getDate() + 7 * delta)
    else d.setMonth(d.getMonth() + delta)
    setFechaRef(d)
  }

  const titulo =
    vista === 'mes'
      ? fechaRef.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
      : vista === 'dia'
        ? fechaRef.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
        : `${semana[0].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} – ${semana[6].toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`

  function GrillaHoras({ dias }) {
    const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[560px]" style={{ gridTemplateColumns: `3rem repeat(${dias.length}, 1fr)` }}>
          <div className="border-b border-slate-200" />
          {dias.map((d) => (
            <div
              key={dayKey(d)}
              className={`border-b border-l border-slate-200 px-1 py-2 text-center text-xs font-semibold ${
                dayKey(d) === hoyKey ? 'bg-sun/10 text-brand' : 'text-slate-500'
              }`}
            >
              {DIAS[(d.getDay() + 6) % 7]} {d.getDate()}
            </div>
          ))}
          {horas.map((h) => (
            <div key={h} className="contents">
              <div className="border-b border-slate-100 pr-1 text-right text-[10px] text-slate-400">
                {String(h).padStart(2, '0')}:00
              </div>
              {dias.map((d) => {
                const delSlot = (citasPorDia[dayKey(d)] || []).filter(
                  (c) => new Date(c.fecha).getHours() === h
                )
                return (
                  <div key={dayKey(d) + h} className="min-h-10 space-y-0.5 border-b border-l border-slate-100 p-0.5">
                    {delSlot.map((c) => <CitaBloque key={c.id} cita={c} compact={dias.length > 1} />)}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!cliente) return <p className="py-10 text-center text-sm text-slate-500">Crea primero un cliente (instalador).</p>

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold capitalize text-navy">{titulo}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {[['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${vista === v ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => mover(-1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">←</button>
          <button onClick={() => setFechaRef(new Date())} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">Hoy</button>
          <button onClick={() => mover(1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">→</button>
          <button onClick={() => setModal(true)} className="rounded-lg bg-sun px-4 py-1.5 text-sm font-bold text-navy hover:brightness-105">
            + Nueva cita
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando citas…</p>
      ) : (
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            {vista === 'semana' && <GrillaHoras dias={semana} />}
            {vista === 'dia' && <GrillaHoras dias={[fechaRef]} />}
            {vista === 'mes' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-semibold uppercase text-slate-500">
                  {DIAS.map((d) => <div key={d} className="py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {celdasMes.map((f, i) => {
                    if (!f) return <div key={`x${i}`} className="min-h-24 border-b border-r border-slate-100 bg-slate-50" />
                    const k = dayKey(f)
                    return (
                      <div key={k} className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${k === hoyKey ? 'bg-sun/10' : ''}`}>
                        <p className={`mb-1 text-xs font-semibold ${k === hoyKey ? 'text-brand' : 'text-slate-500'}`}>{f.getDate()}</p>
                        <div className="space-y-1">
                          {(citasPorDia[k] || []).map((c) => <CitaBloque key={c.id} cita={c} compact />)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="hidden w-56 shrink-0 lg:block">
            <MiniMes fechaRef={fechaRef} onPick={setFechaRef} />
          </div>
        </div>
      )}

      {modal && (
        <NuevaCitaModal
          clienteId={cliente.id}
          empresa={cliente.nombre_empresa}
          leads={leads}
          fechaInicial={dayKey(fechaRef)}
          onClose={() => setModal(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
