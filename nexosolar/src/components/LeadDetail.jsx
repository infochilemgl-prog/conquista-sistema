import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import {
  ESTADOS,
  TRAMO_LABELS,
  PLAZO_LABELS,
  TECHO_LABELS,
  waLink,
} from '../lib/labels'
import { PLANTILLAS_LEAD } from '../lib/plantillas'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none'

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm">{children ?? '—'}</p>
    </div>
  )
}

export default function LeadDetail({ lead, onClose, onChanged }) {
  const { cliente } = useApp()
  const [estado, setEstado] = useState(lead.estado)
  const [valor, setValor] = useState(lead.valor_estimado ?? '')
  const [notas, setNotas] = useState(lead.notas ?? '')
  const [asignado, setAsignado] = useState(lead.asignado_a ?? '')
  const [tags, setTags] = useState([])
  const [leadTagIds, setLeadTagIds] = useState(new Set())
  const [perfiles, setPerfiles] = useState([])
  const [timeline, setTimeline] = useState([])
  const [nuevaTag, setNuevaTag] = useState('')
  const [plantillaId, setPlantillaId] = useState('confirmacion')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setEstado(lead.estado)
    setValor(lead.valor_estimado ?? '')
    setNotas(lead.notas ?? '')
    setAsignado(lead.asignado_a ?? '')
    setMsg('')
    cargarExtras()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  async function cargarExtras() {
    try {
      const [tagsRes, ltRes, perfRes, msjRes, citasRes] = await Promise.all([
        supabase.from('tags').select('*').eq('cliente_id', lead.cliente_id),
        supabase.from('lead_tags').select('tag_id').eq('lead_id', lead.id),
        supabase.from('perfiles').select('id, nombre'),
        supabase
          .from('mensajes')
          .select('id, direccion, canal, texto, created_at')
          .eq('lead_id', lead.id),
        supabase
          .from('citas')
          .select('id, fecha, notas, created_at')
          .eq('lead_id', lead.id),
      ])
      if (!tagsRes.error) setTags(tagsRes.data || [])
      if (!ltRes.error) setLeadTagIds(new Set((ltRes.data || []).map((x) => x.tag_id)))
      if (!perfRes.error) setPerfiles(perfRes.data || [])
      const eventos = [
        { tipo: 'creado', fecha: lead.created_at, texto: `Lead creado (${lead.origen})` },
        ...(msjRes.data || []).map((m) => ({
          tipo: m.direccion === 'in' ? 'msg_in' : 'msg_out',
          fecha: m.created_at,
          texto: m.texto,
        })),
        ...(citasRes.data || []).map((c) => ({
          tipo: 'cita',
          fecha: c.created_at,
          texto: `Cita agendada para ${new Date(c.fecha).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${c.notas ? ` — ${c.notas}` : ''}`,
        })),
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      setTimeline(eventos)
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleTag(tagId) {
    const nuevo = new Set(leadTagIds)
    if (nuevo.has(tagId)) {
      nuevo.delete(tagId)
      await supabase.from('lead_tags').delete().match({ lead_id: lead.id, tag_id: tagId })
    } else {
      nuevo.add(tagId)
      await supabase.from('lead_tags').insert({ lead_id: lead.id, tag_id: tagId })
    }
    setLeadTagIds(nuevo)
  }

  async function crearTag(e) {
    e.preventDefault()
    const nombre = nuevaTag.trim()
    if (!nombre) return
    const { data, error } = await supabase
      .from('tags')
      .insert({ cliente_id: lead.cliente_id, nombre })
      .select()
      .single()
    if (!error && data) {
      setTags((t) => [...t, data])
      setNuevaTag('')
      toggleTag(data.id)
    }
  }

  const empresa = cliente?.nombre_empresa || 'nuestro equipo'
  const textoPlantilla = (PLANTILLAS_LEAD.find((p) => p.id === plantillaId) || PLANTILLAS_LEAD[0]).texto(lead, empresa)

  async function enviarWhatsApp() {
    window.open(waLink(lead.telefono, textoPlantilla), '_blank')
    await supabase.from('mensajes').insert({
      lead_id: lead.id,
      cliente_id: lead.cliente_id,
      direccion: 'out',
      canal: 'whatsapp',
      texto: textoPlantilla,
      enviado_por: 'manual',
    })
    if (lead.estado === 'Lead') {
      await supabase.from('leads').update({ estado: 'Contactado' }).eq('id', lead.id)
      setEstado('Contactado')
    }
    cargarExtras()
    onChanged?.()
  }

  async function guardar() {
    const { error } = await supabase
      .from('leads')
      .update({
        estado,
        valor_estimado: valor === '' ? null : Number(valor),
        notas: notas || null,
        asignado_a: asignado || null,
      })
      .eq('id', lead.id)
    setMsg(error ? 'Error al guardar' : 'Guardado ✓')
    if (!error) onChanged?.()
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (!error) {
      onChanged?.()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-bold text-navy">{lead.nombre}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">✕</button>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          {lead.origen} · ingresó el{' '}
          {new Date(lead.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {/* Acciones */}
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">WhatsApp</p>
            <select
              value={plantillaId}
              onChange={(e) => setPlantillaId(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              {PLANTILLAS_LEAD.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <p className="mb-2 rounded-lg bg-white p-2 text-xs text-slate-600">{textoPlantilla}</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={enviarWhatsApp}
              className="rounded-lg bg-green-600 px-2 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              💬 Enviar
            </button>
            <a
              href={`tel:${lead.telefono}`}
              className="rounded-lg bg-brand px-2 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
            >
              📞 Llamar
            </a>
            <a
              href={lead.email ? `mailto:${lead.email}` : undefined}
              className={`rounded-lg bg-slate-600 px-2 py-2 text-center text-sm font-semibold text-white hover:brightness-110 ${!lead.email ? 'pointer-events-none opacity-40' : ''}`}
            >
              ✉️ Email
            </a>
          </div>
        </div>

        {/* Calificación */}
        <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2">
          <Field label="Teléfono">{lead.telefono}</Field>
          <Field label="Email">{lead.email}</Field>
          <Field label="Comuna">{lead.comuna}</Field>
          <Field label="Dirección">{lead.direccion}</Field>
          <Field label="Vivienda">{lead.tipo_vivienda}</Field>
          <Field label="¿Dueño?">{lead.es_dueno == null ? '—' : lead.es_dueno ? 'Sí' : 'No'}</Field>
          <Field label="Boleta">{TRAMO_LABELS[lead.tramo_boleta]}</Field>
          <Field label="Techo con sol">{TECHO_LABELS[lead.techo_sol]}</Field>
          <Field label="Plazo">{PLAZO_LABELS[lead.plazo]}</Field>
        </div>

        {/* Edición */}
        <div className="space-y-3 border-t border-slate-200 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputCls}>
                {ESTADOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy">Valor (CLP)</label>
              <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className={inputCls} placeholder="4500000" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy">Asignado a</label>
            <select value={asignado} onChange={(e) => setAsignado(e.target.value)} className={inputCls}>
              <option value="">Sin asignar</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy">Etiquetas</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    leadTagIds.has(t.id)
                      ? 'border-transparent text-white'
                      : 'border-slate-300 text-slate-500 hover:border-slate-400'
                  }`}
                  style={leadTagIds.has(t.id) ? { background: t.color } : undefined}
                >
                  {t.nombre}
                </button>
              ))}
              <form onSubmit={crearTag} className="inline-flex">
                <input
                  value={nuevaTag}
                  onChange={(e) => setNuevaTag(e.target.value)}
                  placeholder="+ nueva"
                  className="w-20 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs focus:outline-none"
                />
              </form>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy">Notas</label>
            <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={guardar} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-125">
                Guardar
              </button>
              {msg && <span className="text-sm text-slate-500">{msg}</span>}
            </div>
            <button onClick={eliminar} className="text-sm text-red-500 hover:text-red-700">
              Eliminar
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-5 border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Actividad</p>
          <ul className="space-y-2">
            {timeline.map((e, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span>
                  {e.tipo === 'msg_out' ? '➡️' : e.tipo === 'msg_in' ? '⬅️' : e.tipo === 'cita' ? '📅' : '✨'}
                </span>
                <div>
                  <p className="text-slate-700">{e.texto}</p>
                  <p className="text-slate-400">
                    {new Date(e.fecha).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
