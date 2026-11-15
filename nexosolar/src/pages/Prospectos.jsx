import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { waLink } from '../lib/labels'
import {
  ESTADOS_PROSPECTO,
  FUENTES,
  COLORES_ESTADO,
  PLANTILLAS,
} from '../lib/ventas'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'

function NuevoProspectoModal({ onClose, onCreated }) {
  const [f, setF] = useState({
    nombre_empresa: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    instagram: '',
    sitio_web: '',
    region: 'Valparaíso',
    comuna: '',
    fuente: 'Google',
    notas: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!f.nombre_empresa.trim()) {
      setError('El nombre de la empresa es obligatorio.')
      return
    }
    setSaving(true)
    const payload = Object.fromEntries(
      Object.entries(f).map(([k, v]) => [k, v.trim?.() || v || null])
    )
    const { error: err } = await supabase.from('prospectos').insert(payload)
    setSaving(false)
    if (err) {
      setError('No se pudo guardar.')
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
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-navy">Nuevo prospecto</h2>
        <input
          className={inputCls}
          placeholder="Nombre de la empresa *"
          value={f.nombre_empresa}
          onChange={set('nombre_empresa')}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputCls}
            placeholder="Nombre del contacto"
            value={f.contacto_nombre}
            onChange={set('contacto_nombre')}
          />
          <input
            className={inputCls}
            placeholder="Teléfono (+56 9…)"
            value={f.telefono}
            onChange={set('telefono')}
          />
          <input
            className={inputCls}
            placeholder="Email"
            value={f.email}
            onChange={set('email')}
          />
          <input
            className={inputCls}
            placeholder="Instagram (@…)"
            value={f.instagram}
            onChange={set('instagram')}
          />
          <input
            className={inputCls}
            placeholder="Sitio web"
            value={f.sitio_web}
            onChange={set('sitio_web')}
          />
          <input
            className={inputCls}
            placeholder="Región"
            value={f.region}
            onChange={set('region')}
          />
          <input
            className={inputCls}
            placeholder="Comuna"
            value={f.comuna}
            onChange={set('comuna')}
          />
          <select className={inputCls} value={f.fuente} onChange={set('fuente')}>
            {FUENTES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <textarea
          className={inputCls}
          rows={2}
          placeholder="Notas"
          value={f.notas}
          onChange={set('notas')}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </div>
  )
}

function DetalleProspecto({ prospecto: p, onClose, onChanged }) {
  const [estado, setEstado] = useState(p.estado)
  const [notas, setNotas] = useState(p.notas || '')
  const [llamada, setLlamada] = useState(
    p.llamada_fecha ? p.llamada_fecha.slice(0, 16) : ''
  )
  const [seguimiento, setSeguimiento] = useState(p.proximo_seguimiento || '')
  const [plantilla, setPlantilla] = useState('apertura')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setEstado(p.estado)
    setNotas(p.notas || '')
    setLlamada(p.llamada_fecha ? p.llamada_fecha.slice(0, 16) : '')
    setSeguimiento(p.proximo_seguimiento || '')
    setMsg('')
  }, [p])

  const textoPlantilla = PLANTILLAS.find((t) => t.id === plantilla).texto(p)

  async function registrarActividad(tipo, detalle, cambios = {}) {
    await supabase
      .from('actividades')
      .insert({ prospecto_id: p.id, tipo, detalle })
    const update = { ultimo_contacto: new Date().toISOString(), ...cambios }
    await supabase.from('prospectos').update(update).eq('id', p.id)
    onChanged()
  }

  function enviarWhatsApp() {
    window.open(waLink(p.telefono, textoPlantilla), '_blank')
    const cambios =
      p.estado === 'Por contactar' ? { estado: 'Contactado' } : {}
    registrarActividad('mensaje', `WhatsApp: ${plantilla}`, cambios)
    setMsg('Mensaje registrado en el contador ✓')
  }

  function registrarLlamada() {
    registrarActividad('llamada', 'Llamada en frío')
    setMsg('Llamada registrada en el contador ✓')
  }

  async function guardar() {
    const { error } = await supabase
      .from('prospectos')
      .update({
        estado,
        notas: notas || null,
        llamada_fecha: llamada ? new Date(llamada).toISOString() : null,
        proximo_seguimiento: seguimiento || null,
      })
      .eq('id', p.id)
    if (!error) {
      setMsg('Guardado ✓')
      onChanged()
    } else {
      setMsg('Error al guardar')
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-bold text-navy">{p.nombre_empresa}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {[p.contacto_nombre, p.comuna, p.region, p.fuente]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* Acciones de contacto */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Mensaje</p>
            <select
              value={plantilla}
              onChange={(e) => setPlantilla(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              {PLANTILLAS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <p className="mb-3 whitespace-pre-wrap rounded-lg bg-white p-2 text-xs text-slate-600">
            {textoPlantilla}
          </p>
          <div className="flex gap-2">
            <button
              onClick={enviarWhatsApp}
              disabled={!p.telefono}
              className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
            >
              💬 Enviar WhatsApp
            </button>
            <a
              href={p.telefono ? `tel:${p.telefono}` : undefined}
              onClick={p.telefono ? registrarLlamada : undefined}
              className={`flex-1 rounded-lg bg-brand px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110 ${
                !p.telefono ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              📞 Llamar
            </a>
          </div>
          {!p.telefono && (
            <p className="mt-2 text-xs text-amber-600">
              Sin teléfono: contacta por Instagram{' '}
              {p.instagram ? `(${p.instagram})` : ''} y registra la actividad
              con el botón de abajo.
            </p>
          )}
          <button
            onClick={() => {
              registrarActividad('mensaje', 'DM Instagram / otro canal')
              setMsg('Contacto registrado en el contador ✓')
            }}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Registrar contacto manual (DM / email)
          </button>
        </div>

        {/* Datos */}
        <div className="mb-4 space-y-1 text-sm text-slate-700">
          {p.telefono && <p>📱 {p.telefono}</p>}
          {p.email && <p>✉️ {p.email}</p>}
          {p.instagram && <p>📸 {p.instagram}</p>}
          {p.sitio_web && <p>🌐 {p.sitio_web}</p>}
          {p.ultimo_contacto && (
            <p className="text-xs text-slate-400">
              Último contacto:{' '}
              {new Date(p.ultimo_contacto).toLocaleString('es-CL')}
            </p>
          )}
        </div>

        {/* Gestión */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={inputCls}
            >
              {ESTADOS_PROSPECTO.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">
                Llamada agendada
              </label>
              <input
                type="datetime-local"
                value={llamada}
                onChange={(e) => setLlamada(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">
                Próx. seguimiento
              </label>
              <input
                type="date"
                value={seguimiento}
                onChange={(e) => setSeguimiento(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Notas
            </label>
            <textarea
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Dolor detectado, margen, cuántos trabajos hace al mes…"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={guardar}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-125"
            >
              Guardar
            </button>
            {msg && <span className="text-sm text-slate-500">{msg}</span>}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function Prospectos() {
  const [prospectos, setProspectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const filtroEstado = searchParams.get('estado') || ''
  const [filtroFuente, setFiltroFuente] = useState('')
  const [filtroRegion, setFiltroRegion] = useState('')
  const [sel, setSel] = useState(null)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) {
        setProspectos(data || [])
        setSel((s) => (s ? data.find((x) => x.id === s.id) || null : null))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const regiones = useMemo(
    () => [...new Set(prospectos.map((p) => p.region).filter(Boolean))].sort(),
    [prospectos]
  )

  const filtrados = useMemo(
    () =>
      prospectos.filter((p) => {
        const q = busqueda.toLowerCase()
        const matchQ =
          !q ||
          p.nombre_empresa.toLowerCase().includes(q) ||
          (p.contacto_nombre || '').toLowerCase().includes(q) ||
          (p.comuna || '').toLowerCase().includes(q)
        return (
          matchQ &&
          (!filtroEstado || p.estado === filtroEstado) &&
          (!filtroFuente || p.fuente === filtroFuente) &&
          (!filtroRegion || p.region === filtroRegion)
        )
      }),
    [prospectos, busqueda, filtroEstado, filtroFuente, filtroRegion]
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">
          Prospectos{' '}
          <span className="text-base font-normal text-slate-400">
            ({filtrados.length})
          </span>
        </h1>
        <button
          onClick={() => setModal(true)}
          className="rounded-lg bg-sun px-4 py-2 text-sm font-bold text-navy hover:brightness-105"
        >
          + Agregar
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar empresa, contacto o comuna…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select
          value={filtroEstado}
          onChange={(e) =>
            setSearchParams(e.target.value ? { estado: e.target.value } : {})
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_PROSPECTO.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filtroFuente}
          onChange={(e) => setFiltroFuente(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Toda fuente</option>
          {FUENTES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filtroRegion}
          onChange={(e) => setFiltroRegion(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Toda región</option>
          {regiones.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-500">Cargando…</p>
      ) : prospectos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="mb-2 font-semibold text-navy">
            Tu lista está vacía.
          </p>
          <p className="text-sm text-slate-500">
            Paso 1 del manual: arma la lista (ACESOL, registro SEC, Google e
            Instagram por comuna) y agrégalos acá. Después, 50 contactos al
            día.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="hidden px-4 py-3 sm:table-cell">Contacto</th>
                <th className="hidden px-4 py-3 md:table-cell">Comuna</th>
                <th className="hidden px-4 py-3 md:table-cell">Fuente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 sm:table-cell">Últ. contacto</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSel(p)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-brand/5"
                >
                  <td className="px-4 py-3 font-medium text-navy">
                    {p.nombre_empresa}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {p.contacto_nombre || '—'}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {p.comuna || '—'}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{p.fuente}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_ESTADO[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                    {p.ultimo_contacto
                      ? new Date(p.ultimo_contacto).toLocaleDateString('es-CL')
                      : 'Nunca'}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Sin resultados con estos filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <NuevoProspectoModal onClose={() => setModal(false)} onCreated={load} />
      )}
      {sel && (
        <DetalleProspecto
          prospecto={sel}
          onClose={() => setSel(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}
