import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import {
  ESTADOS,
  TRAMO_LABELS,
  PLAZO_LABELS,
  TECHO_LABELS,
  formatCLP,
  waLink,
} from '../lib/labels'

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm text-slate-800">{children ?? '—'}</p>
    </div>
  )
}

function DetallePanel({ lead, onClose, onSaved }) {
  const [valor, setValor] = useState(lead.valor_estimado ?? '')
  const [notas, setNotas] = useState(lead.notas ?? '')
  const [estado, setEstado] = useState(lead.estado)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setValor(lead.valor_estimado ?? '')
    setNotas(lead.notas ?? '')
    setEstado(lead.estado)
    setMsg('')
  }, [lead])

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('leads')
      .update({
        valor_estimado: valor === '' ? null : Number(valor),
        notas: notas || null,
        estado,
      })
      .eq('id', lead.id)
    setSaving(false)
    if (error) {
      setMsg('Error al guardar. Intenta de nuevo.')
      return
    }
    setMsg('Guardado ✓')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-navy">{lead.nombre}</h2>
            <p className="text-sm text-slate-500">
              Ingresó el{' '}
              {new Date(lead.created_at).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          <a
            href={`tel:${lead.telefono}`}
            className="flex-1 rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
          >
            📞 Llamar
          </a>
          <a
            href={waLink(lead.telefono)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
          >
            💬 WhatsApp
          </a>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Teléfono">{lead.telefono}</Field>
          <Field label="Email">{lead.email}</Field>
          <Field label="Comuna">{lead.comuna}</Field>
          <Field label="Dirección">{lead.direccion}</Field>
          <Field label="Vivienda">{lead.tipo_vivienda}</Field>
          <Field label="¿Dueño?">
            {lead.es_dueno == null ? '—' : lead.es_dueno ? 'Sí' : 'No'}
          </Field>
          <Field label="Boleta">{TRAMO_LABELS[lead.tramo_boleta]}</Field>
          <Field label="Techo con sol">{TECHO_LABELS[lead.techo_sol]}</Field>
          <Field label="Plazo">{PLAZO_LABELS[lead.plazo]}</Field>
          <Field label="Origen">{lead.origen}</Field>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {ESTADOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Valor estimado (CLP)
            </label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: 2500000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Notas
            </label>
            <textarea
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Apuntes de la conversación…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-125 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {msg && <span className="text-sm text-slate-500">{msg}</span>}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function Contactos() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setLeads(data || [])
    setLoading(false)
  }

  const filtrados = useMemo(() => {
    return leads.filter((l) => {
      const matchNombre = l.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())
      const matchEstado = !filtroEstado || l.estado === filtroEstado
      return matchNombre && matchEstado
    })
  }, [leads, busqueda, filtroEstado])

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-navy">Contactos</h1>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="hidden px-4 py-3 sm:table-cell">Comuna</th>
                <th className="hidden px-4 py-3 md:table-cell">Boleta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 sm:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSeleccionado(l)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-brand/5"
                >
                  <td className="px-4 py-3 font-medium text-navy">
                    {l.nombre}
                  </td>
                  <td className="px-4 py-3">{l.telefono}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {l.comuna || '—'}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {TRAMO_LABELS[l.tramo_boleta] || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
                      {l.estado}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                    {new Date(l.created_at).toLocaleDateString('es-CL')}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado && (
        <DetallePanel
          lead={seleccionado}
          onClose={() => setSeleccionado(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
