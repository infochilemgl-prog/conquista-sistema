import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import { ESTADOS, TRAMO_LABELS } from '../lib/labels'
import LeadDetail from '../components/LeadDetail'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'

function AgregarModal({ clienteId, onClose, onCreated }) {
  const [f, setF] = useState({
    nombre: '',
    telefono: '',
    email: '',
    comuna: '',
    tramo_boleta: '',
    estado: 'Lead',
    valor_estimado: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!f.nombre.trim() || !f.telefono.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }
    setSaving(true)
    const { error: err } = await supabase.from('leads').insert({
      cliente_id: clienteId,
      nombre: f.nombre.trim(),
      telefono: f.telefono.trim(),
      email: f.email.trim() || null,
      comuna: f.comuna.trim() || null,
      tramo_boleta: f.tramo_boleta || null,
      estado: f.estado,
      valor_estimado: f.valor_estimado === '' ? null : Number(f.valor_estimado),
      origen: 'Manual',
    })
    setSaving(false)
    if (err) {
      setError('No se pudo guardar.')
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-bold text-navy">Agregar contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Nombre *" value={f.nombre} onChange={set('nombre')} />
          <input className={inputCls} placeholder="Teléfono *" value={f.telefono} onChange={set('telefono')} />
          <input className={inputCls} placeholder="Email" value={f.email} onChange={set('email')} />
          <input className={inputCls} placeholder="Comuna" value={f.comuna} onChange={set('comuna')} />
          <select className={inputCls} value={f.tramo_boleta} onChange={set('tramo_boleta')}>
            <option value="">Boleta…</option>
            {Object.entries(TRAMO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select className={inputCls} value={f.estado} onChange={set('estado')}>
            {ESTADOS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className={inputCls} type="number" placeholder="Valor (CLP)" value={f.valor_estimado} onChange={set('valor_estimado')} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Contactos() {
  const { cliente } = useApp()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(false)
  const [csvMsg, setCsvMsg] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    if (cliente) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  async function load() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
      if (!error) {
        setLeads(data || [])
        setSel((s) => (s ? (data || []).find((x) => x.id === s.id) || null : null))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function importarCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvMsg('Leyendo…')
    const texto = await file.text()
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim())
    if (lineas.length < 2) {
      setCsvMsg('El CSV necesita encabezado + filas.')
      return
    }
    const headers = lineas[0].split(',').map((h) => h.trim().toLowerCase())
    const idx = (n) => headers.indexOf(n)
    if (idx('nombre') === -1 || idx('telefono') === -1) {
      setCsvMsg('El CSV debe tener columnas "nombre" y "telefono" (y opcionales: email, comuna, tramo_boleta, estado, valor_estimado).')
      return
    }
    const filas = lineas.slice(1).map((l) => {
      const c = l.split(',').map((x) => x.trim())
      const get = (n) => (idx(n) >= 0 ? c[idx(n)] || null : null)
      return {
        cliente_id: cliente.id,
        nombre: get('nombre'),
        telefono: get('telefono'),
        email: get('email'),
        comuna: get('comuna'),
        tramo_boleta: ['menos_40k', '40_70k', '70_140k', 'mas_140k'].includes(get('tramo_boleta')) ? get('tramo_boleta') : null,
        estado: ESTADOS.includes(get('estado')) ? get('estado') : 'Lead',
        valor_estimado: get('valor_estimado') ? Number(get('valor_estimado')) : null,
        origen: 'Manual',
      }
    }).filter((f) => f.nombre && f.telefono)
    if (filas.length === 0) {
      setCsvMsg('Ninguna fila válida.')
      return
    }
    const { error } = await supabase.from('leads').insert(filas)
    setCsvMsg(error ? 'Error al importar.' : `${filas.length} contactos importados ✓`)
    if (!error) load()
    e.target.value = ''
  }

  const filtrados = useMemo(
    () =>
      leads.filter((l) => {
        const q = busqueda.toLowerCase()
        const matchQ =
          !q ||
          l.nombre.toLowerCase().includes(q) ||
          (l.comuna || '').toLowerCase().includes(q) ||
          (l.telefono || '').includes(q)
        return matchQ && (!filtroEstado || l.estado === filtroEstado)
      }),
    [leads, busqueda, filtroEstado]
  )

  if (!cliente) return <p className="py-10 text-center text-sm text-slate-500">Crea primero un cliente (instalador).</p>

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-navy">
          Contactos <span className="text-base font-normal text-slate-400">({filtrados.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importarCSV} />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ⬆️ Importar CSV
          </button>
          <button onClick={() => setModal(true)} className="rounded-lg bg-sun px-4 py-2 text-sm font-bold text-navy hover:brightness-105">
            + Agregar contacto
          </button>
        </div>
      </div>
      {csvMsg && <p className="mb-3 text-sm text-slate-500">{csvMsg}</p>}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, comuna o teléfono…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s}>{s}</option>)}
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
                <th className="hidden px-4 py-3 md:table-cell">Origen</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 sm:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => (
                <tr key={l.id} onClick={() => setSel(l)} className="cursor-pointer border-t border-slate-100 hover:bg-brand/5">
                  <td className="px-4 py-3 font-medium text-navy">{l.nombre}</td>
                  <td className="px-4 py-3">{l.telefono}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{l.comuna || '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{TRAMO_LABELS[l.tramo_boleta] || '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{l.origen}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">{l.estado}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                    {new Date(l.created_at).toLocaleDateString('es-CL')}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && <AgregarModal clienteId={cliente.id} onClose={() => setModal(false)} onCreated={load} />}
      {sel && <LeadDetail lead={sel} onClose={() => setSel(null)} onChanged={load} />}
    </div>
  )
}
