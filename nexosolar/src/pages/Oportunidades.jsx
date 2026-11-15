import { useEffect, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/app'
import { ESTADOS, TRAMO_LABELS, formatCLP, waLink } from '../lib/labels'
import { plantilla } from '../lib/plantillas'
import LeadDetail from '../components/LeadDetail'

function AccionIcono({ title, onClick, href, children }) {
  const cls =
    'rounded p-1 text-sm leading-none text-slate-400 hover:bg-slate-100 hover:text-navy'
  const stop = (e) => e.stopPropagation()
  if (href)
    return (
      <a href={href} title={title} className={cls} onClick={stop} onPointerDown={stop} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {children}
      </a>
    )
  return (
    <button
      title={title}
      className={cls}
      onPointerDown={stop}
      onClick={(e) => {
        stop(e)
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}

function LeadCard({ lead, overlay = false, acciones }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm ${overlay ? 'rotate-2 shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold text-navy">{lead.nombre}</p>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {lead.origen}
        </span>
      </div>
      <p className="text-xs text-slate-500">{lead.comuna || 'Sin comuna'}</p>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="rounded bg-brand/10 px-1.5 py-0.5 font-medium text-brand">
          {TRAMO_LABELS[lead.tramo_boleta] || 'Boleta ?'}
        </span>
        <span className="font-semibold text-slate-700">{formatCLP(lead.valor_estimado)}</span>
      </div>
      {!overlay && acciones && (
        <div className="mt-2 flex items-center gap-0.5 border-t border-slate-100 pt-1.5">
          {acciones}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ lead, onOpen, onWhatsApp, onAgendar }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(lead)}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
    >
      <LeadCard
        lead={lead}
        acciones={
          <>
            <AccionIcono title="Llamar" href={`tel:${lead.telefono}`}>📞</AccionIcono>
            <AccionIcono title="WhatsApp" onClick={() => onWhatsApp(lead)}>💬</AccionIcono>
            <AccionIcono title="Etiquetas y notas" onClick={() => onOpen(lead)}>🏷️</AccionIcono>
            <AccionIcono title="Nota" onClick={() => onOpen(lead)}>📝</AccionIcono>
            <AccionIcono title="Agendar cita" onClick={() => onAgendar(lead)}>📅</AccionIcono>
          </>
        }
      />
    </div>
  )
}

function Column({ estado, leads, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })
  const total = leads.reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0)
  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-xl border bg-white/60 ${
        isOver ? 'border-brand ring-2 ring-brand/30' : 'border-slate-200'
      }`}
    >
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy">{estado}</h2>
          <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            {leads.length}
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-500">{formatCLP(total)}</p>
      </div>
      <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">{children}</div>
    </div>
  )
}

function AgendarModal({ lead, clienteId, onClose, onDone }) {
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('10:00')
  const [notas, setNotas] = useState('Visita técnica — evaluación de ahorro')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!fecha) return
    setSaving(true)
    const fechaISO = new Date(`${fecha}T${hora}`).toISOString()
    await supabase.from('citas').insert({ cliente_id: clienteId, lead_id: lead.id, fecha: fechaISO, notas })
    await supabase.from('leads').update({ estado: 'Cita agendada' }).eq('id', lead.id)
    // Recordatorio automático 3 horas antes
    const recordar = new Date(new Date(`${fecha}T${hora}`).getTime() - 3 * 3600000)
    await supabase.from('tareas_automaticas').insert({
      cliente_id: clienteId,
      lead_id: lead.id,
      tipo: 'recordatorio',
      canal: 'whatsapp',
      programada_para: recordar.toISOString(),
      estado: 'pendiente',
      payload: plantilla('recordatorio', lead, '', hora),
    })
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="font-bold text-navy">Agendar cita — {lead.nombre}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <input value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-600">Cancelar</button>
          <button type="submit" disabled={saving || !fecha} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Guardando…' : 'Agendar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Oportunidades() {
  const { cliente } = useApp()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [sel, setSel] = useState(null)
  const [agendar, setAgendar] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  useEffect(() => {
    if (!cliente) return
    load()
    const canal = supabase
      .channel('leads-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(canal)
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

  async function enviarWhatsApp(lead) {
    const texto = plantilla('confirmacion', lead, cliente?.nombre_empresa || 'nuestro equipo')
    window.open(waLink(lead.telefono, texto), '_blank')
    await supabase.from('mensajes').insert({
      lead_id: lead.id,
      cliente_id: cliente.id,
      direccion: 'out',
      canal: 'whatsapp',
      texto,
      enviado_por: 'manual',
    })
    if (lead.estado === 'Lead') {
      await supabase.from('leads').update({ estado: 'Contactado' }).eq('id', lead.id)
      load()
    }
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.estado === over.id) return
    const prev = leads
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, estado: over.id } : l)))
    const { error } = await supabase.from('leads').update({ estado: over.id }).eq('id', lead.id)
    if (error) setLeads(prev)
  }

  const activeLead = leads.find((l) => l.id === activeId)

  if (!cliente) return <p className="py-10 text-center text-sm text-slate-500">Crea primero un cliente (instalador).</p>
  if (loading) return <p className="py-10 text-center text-slate-500">Cargando pipeline…</p>

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-navy">Oportunidades</h1>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ESTADOS.map((estado) => {
            const deCol = leads.filter((l) => l.estado === estado)
            return (
              <Column key={estado} estado={estado} leads={deCol}>
                {deCol.map((lead) => (
                  <DraggableCard
                    key={lead.id}
                    lead={lead}
                    onOpen={setSel}
                    onWhatsApp={enviarWhatsApp}
                    onAgendar={setAgendar}
                  />
                ))}
                {deCol.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Vacío</p>
                )}
              </Column>
            )
          })}
        </div>
        <DragOverlay>{activeLead ? <LeadCard lead={activeLead} overlay /> : null}</DragOverlay>
      </DndContext>

      {sel && <LeadDetail lead={sel} onClose={() => setSel(null)} onChanged={load} />}
      {agendar && (
        <AgendarModal
          lead={agendar}
          clienteId={cliente.id}
          onClose={() => setAgendar(null)}
          onDone={load}
        />
      )}
    </div>
  )
}
