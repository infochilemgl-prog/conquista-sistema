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
import { ESTADOS, TRAMO_LABELS, formatCLP } from '../lib/labels'

function LeadCard({ lead, overlay = false }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm ${
        overlay ? 'rotate-2 shadow-lg' : ''
      }`}
    >
      <p className="font-semibold text-navy">{lead.nombre}</p>
      <p className="text-slate-500">{lead.comuna || 'Sin comuna'}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="rounded bg-brand/10 px-1.5 py-0.5 font-medium text-brand">
          {TRAMO_LABELS[lead.tramo_boleta] || 'Boleta ?'}
        </span>
        <span className="font-semibold text-slate-700">
          {formatCLP(lead.valor_estimado)}
        </span>
      </div>
    </div>
  )
}

function DraggableCard({ lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <LeadCard lead={lead} />
    </div>
  )
}

function Column({ estado, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })
  const total = leads.reduce((s, l) => s + (Number(l.valor_estimado) || 0), 0)
  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-xl border bg-slate-100 ${
        isOver ? 'border-brand ring-2 ring-brand/30' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="text-sm font-bold text-navy">{estado}</h2>
        <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
          {leads.length}
        </span>
      </div>
      <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">Vacío</p>
        )}
      </div>
      {total > 0 && (
        <p className="border-t border-slate-200 px-3 py-1.5 text-right text-xs font-semibold text-slate-600">
          {formatCLP(total)}
        </p>
      )}
    </div>
  )
}

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  )

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

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const nuevoEstado = over.id
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || lead.estado === nuevoEstado) return

    const prev = leads
    setLeads((ls) =>
      ls.map((l) => (l.id === lead.id ? { ...l, estado: nuevoEstado } : l))
    )
    const { error } = await supabase
      .from('leads')
      .update({ estado: nuevoEstado })
      .eq('id', lead.id)
    if (error) {
      setLeads(prev)
      alert('No se pudo mover el lead. Revisa tu conexión.')
    }
  }

  const activeLead = leads.find((l) => l.id === activeId)

  if (loading) {
    return <p className="py-10 text-center text-slate-500">Cargando pipeline…</p>
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-navy">Pipeline</h1>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ESTADOS.map((estado) => (
            <Column
              key={estado}
              estado={estado}
              leads={leads.filter((l) => l.estado === estado)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
