import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import { waLink } from '../lib/labels'

function Burbuja({ m }) {
  const out = m.direccion === 'out'
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          out ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-white text-ink'
        }`}
      >
        <p className="whitespace-pre-wrap">{m.texto}</p>
        <p className={`mt-0.5 text-[10px] ${out ? 'text-blue-100' : 'text-slate-400'}`}>
          {new Date(m.created_at).toLocaleString('es-CL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {m.enviado_por === 'auto' && ' · auto'}
        </p>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition ${value ? 'bg-red-500' : 'bg-slate-300'}`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`}
        />
      </button>
    </label>
  )
}

export default function Conversaciones() {
  const { cliente } = useApp()
  const [leads, setLeads] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [tareasPorLead, setTareasPorLead] = useState({})
  const [tags, setTags] = useState([])
  const [leadTags, setLeadTags] = useState([])
  const [selId, setSelId] = useState(null)
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!cliente) return
    load()
    const canal = supabase
      .channel('mensajes-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (p) => {
        setMensajes((ms) => (ms.some((m) => m.id === p.new.id) ? ms : [...ms, p.new]))
      })
      .subscribe()
    return () => supabase.removeChannel(canal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, selId])

  async function load() {
    try {
      const [lRes, mRes, tRes, tagRes, ltRes] = await Promise.all([
        supabase.from('leads').select('*').eq('cliente_id', cliente.id),
        supabase.from('mensajes').select('*').eq('cliente_id', cliente.id).order('created_at'),
        supabase
          .from('tareas_automaticas')
          .select('lead_id')
          .eq('cliente_id', cliente.id)
          .eq('estado', 'pendiente'),
        supabase.from('tags').select('*').eq('cliente_id', cliente.id),
        supabase.from('lead_tags').select('*'),
      ])
      if (!lRes.error) setLeads(lRes.data || [])
      if (!mRes.error) setMensajes(mRes.data || [])
      if (!tRes.error) {
        const map = {}
        for (const t of tRes.data || []) map[t.lead_id] = (map[t.lead_id] || 0) + 1
        setTareasPorLead(map)
      }
      if (!tagRes.error) setTags(tagRes.data || [])
      if (!ltRes.error) setLeadTags(ltRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const conversaciones = useMemo(() => {
    const porLead = {}
    for (const m of mensajes) {
      porLead[m.lead_id] = m // queda el último (están ordenados asc)
    }
    const conMsj = leads
      .filter((l) => porLead[l.id])
      .map((l) => ({ lead: l, ultimo: porLead[l.id] }))
      .sort((a, b) => new Date(b.ultimo.created_at) - new Date(a.ultimo.created_at))
    const sinMsj = leads
      .filter((l) => !porLead[l.id])
      .map((l) => ({ lead: l, ultimo: null }))
      .sort((a, b) => new Date(b.lead.created_at) - new Date(a.lead.created_at))
    return [...conMsj, ...sinMsj].filter(({ lead }) =>
      lead.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
  }, [leads, mensajes, busqueda])

  const sel = leads.find((l) => l.id === selId)
  const hilo = mensajes.filter((m) => m.lead_id === selId)
  const tagsDelLead = leadTags.filter((lt) => lt.lead_id === selId).map((lt) => lt.tag_id)

  async function enviar(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || !sel) return
    setTexto('')
    const { data } = await supabase
      .from('mensajes')
      .insert({
        lead_id: sel.id,
        cliente_id: cliente.id,
        direccion: 'out',
        canal: 'whatsapp',
        texto: t,
        enviado_por: 'manual',
      })
      .select()
      .single()
    if (data) setMensajes((ms) => (ms.some((m) => m.id === data.id) ? ms : [...ms, data]))
    window.open(waLink(sel.telefono, t), '_blank')
  }

  async function setDnd(campo, valor) {
    await supabase.from('leads').update({ [campo]: valor }).eq('id', sel.id)
    setLeads((ls) => ls.map((l) => (l.id === sel.id ? { ...l, [campo]: valor } : l)))
  }

  if (!cliente) return <p className="py-10 text-center text-sm text-slate-500">Crea primero un cliente (instalador).</p>
  if (loading) return <p className="py-10 text-center text-slate-500">Cargando conversaciones…</p>

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[calc(100vh-5.5rem)]">
      {/* Lista */}
      <div className={`w-full flex-col border-r border-slate-200 sm:w-72 sm:shrink-0 ${sel ? 'hidden sm:flex' : 'flex'}`}>
        <div className="border-b border-slate-200 p-3">
          <h1 className="mb-2 font-bold text-navy">Conversaciones</h1>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversaciones.map(({ lead, ultimo }) => (
            <button
              key={lead.id}
              onClick={() => setSelId(lead.id)}
              className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 ${
                selId === lead.id ? 'bg-brand/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-navy">{lead.nombre}</p>
                {ultimo && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(ultimo.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">
                {ultimo ? `${ultimo.direccion === 'out' ? 'Tú: ' : ''}${ultimo.texto}` : 'Sin mensajes aún'}
              </p>
            </button>
          ))}
          {conversaciones.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">Sin contactos</p>
          )}
        </div>
      </div>

      {/* Hilo */}
      <div className={`min-w-0 flex-1 flex-col bg-fondo ${sel ? 'flex' : 'hidden sm:flex'}`}>
        {!sel ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Elige una conversación
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <button onClick={() => setSelId(null)} className="rounded p-1 text-slate-500 sm:hidden">←</button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{sel.nombre}</p>
                <p className="text-xs text-slate-400">{sel.telefono} · {sel.estado}</p>
              </div>
              <a
                href={waLink(sel.telefono)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Abrir WhatsApp
              </a>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {hilo.map((m) => <Burbuja key={m.id} m={m} />)}
              {hilo.length === 0 && (
                <p className="pt-8 text-center text-xs text-slate-400">
                  Sin mensajes todavía. Escribe el primero abajo.
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={enviar} className="flex gap-2 border-t border-slate-200 bg-white p-3">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje… (se abre en WhatsApp)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <button
                type="submit"
                disabled={!texto.trim()}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </>
        )}
      </div>

      {/* Panel de contacto */}
      {sel && (
        <div className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 p-4 lg:flex">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Contacto</p>
            <p className="mt-1 text-sm">{sel.telefono}</p>
            <p className="text-sm text-slate-500">{sel.email || 'Sin email'}</p>
            <p className="text-sm text-slate-500">{sel.comuna || 'Sin comuna'}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Etiquetas</p>
            <div className="flex flex-wrap gap-1">
              {tags.filter((t) => tagsDelLead.includes(t.id)).map((t) => (
                <span key={t.id} className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: t.color }}>
                  {t.nombre}
                </span>
              ))}
              {tagsDelLead.length === 0 && <span className="text-xs text-slate-400">Sin etiquetas</span>}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Automatizaciones</p>
            <p className="text-sm text-slate-600">
              {tareasPorLead[sel.id]
                ? `${tareasPorLead[sel.id]} mensaje(s) programado(s)`
                : 'Ninguna activa'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">No molestar (DND)</p>
            <Toggle label="WhatsApp" value={!!sel.dnd_whatsapp} onChange={(v) => setDnd('dnd_whatsapp', v)} />
            <Toggle label="Email" value={!!sel.dnd_email} onChange={(v) => setDnd('dnd_email', v)} />
            <Toggle label="Llamadas" value={!!sel.dnd_llamadas} onChange={(v) => setDnd('dnd_llamadas', v)} />
          </div>
        </div>
      )}
    </div>
  )
}
