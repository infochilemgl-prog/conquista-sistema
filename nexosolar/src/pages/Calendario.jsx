import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function monthLabel(date) {
  return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function NuevaCitaModal({ leads, onClose, onCreated }) {
  const [leadId, setLeadId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('10:00')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!leadId || !fecha || !hora) {
      setError('Selecciona un lead, una fecha y una hora.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('citas').insert({
      lead_id: leadId,
      fecha: new Date(`${fecha}T${hora}`).toISOString(),
      notas: notas || null,
    })
    setSaving(false)
    if (err) {
      setError('No se pudo crear la cita.')
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-navy">Nueva cita</h2>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">
            Lead
          </label>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Selecciona un lead…</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} {l.comuna ? `· ${l.comuna}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">
            Notas
          </label>
          <textarea
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: visita técnica para medir el techo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Crear cita'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Calendario() {
  const [mes, setMes] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [citas, setCitas] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [citasRes, leadsRes] = await Promise.all([
      supabase
        .from('citas')
        .select('*, leads(nombre, telefono, comuna)')
        .order('fecha'),
      supabase.from('leads').select('id, nombre, comuna').order('nombre'),
    ])
    if (!citasRes.error) setCitas(citasRes.data || [])
    if (!leadsRes.error) setLeads(leadsRes.data || [])
    setLoading(false)
  }

  const citasPorDia = useMemo(() => {
    const map = {}
    for (const c of citas) {
      const key = dayKey(new Date(c.fecha))
      ;(map[key] ||= []).push(c)
    }
    return map
  }, [citas])

  const celdas = useMemo(() => {
    const year = mes.getFullYear()
    const month = mes.getMonth()
    const primerDia = new Date(year, month, 1)
    // getDay(): 0=domingo. Queremos que la semana parta en lunes.
    const offset = (primerDia.getDay() + 6) % 7
    const diasEnMes = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= diasEnMes; d++) cells.push(new Date(year, month, d))
    return cells
  }, [mes])

  const hoy = dayKey(new Date())

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold capitalize text-navy">
          {monthLabel(mes)}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            ←
          </button>
          <button
            onClick={() => {
              const d = new Date()
              setMes(new Date(d.getFullYear(), d.getMonth(), 1))
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Hoy
          </button>
          <button
            onClick={() =>
              setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            →
          </button>
          <button
            onClick={() => setModal(true)}
            className="rounded-lg bg-sun px-4 py-1.5 text-sm font-bold text-navy hover:brightness-105"
          >
            + Nueva cita
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando citas…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-semibold uppercase text-slate-500">
            {DIAS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celdas.map((fecha, i) => {
              if (!fecha)
                return <div key={`x${i}`} className="min-h-24 border-b border-r border-slate-100 bg-slate-50" />
              const key = dayKey(fecha)
              const delDia = citasPorDia[key] || []
              return (
                <div
                  key={key}
                  className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${
                    key === hoy ? 'bg-sun/10' : ''
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      key === hoy ? 'text-brand' : 'text-slate-500'
                    }`}
                  >
                    {fecha.getDate()}
                  </p>
                  <div className="space-y-1">
                    {delDia.map((c) => (
                      <div
                        key={c.id}
                        title={c.notas || ''}
                        className="truncate rounded bg-brand px-1.5 py-0.5 text-xs font-medium text-white"
                      >
                        {new Date(c.fecha).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        {c.leads?.nombre || 'Cita'}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modal && (
        <NuevaCitaModal
          leads={leads}
          onClose={() => setModal(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
