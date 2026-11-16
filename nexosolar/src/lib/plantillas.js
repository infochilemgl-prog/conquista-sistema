// Plantillas de mensajes al dueño de casa (lead), en nombre del instalador.
const nombrePila = (lead) => (lead?.nombre || '').split(' ')[0]

export const PLANTILLAS_LEAD = [
  {
    id: 'confirmacion',
    nombre: 'Confirmación',
    texto: (lead, empresa) =>
      `Hola ${nombrePila(lead)}, gracias por tu interés en bajar tu cuenta de luz con paneles solares. Soy del equipo de ${empresa}. ¿Te acomoda que coordinemos una evaluación de ahorro gratis esta semana?`,
  },
  {
    id: 'recordatorio',
    nombre: 'Recordatorio de visita',
    texto: (lead, empresa, hora = '[hora]') =>
      `Hola ${nombrePila(lead)}, te recuerdo tu visita de hoy a las ${hora} para la evaluación de tus paneles solares. ¿Confirmas que estás disponible?`,
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento',
    texto: (lead) =>
      `Hola ${nombrePila(lead)}, vi que estabas interesado en paneles solares. Con el alza de tarifas, realmente conviene cotizar ahora. ¿Quieres que te agende la evaluación gratis?`,
  },
  {
    id: 'cita_agendada',
    nombre: 'Cita agendada (confirmar)',
    texto: (lead, empresa, cuando = '[fecha y hora]') =>
      `Hola ${nombrePila(lead)}, tu visita para la evaluación de paneles solares quedó agendada para ${cuando}. Respóndeme SÍ para confirmar. — ${empresa}`,
  },
]

export function plantilla(id, lead, empresa, extra) {
  const t = PLANTILLAS_LEAD.find((x) => x.id === id) || PLANTILLAS_LEAD[0]
  return t.texto(lead, empresa, extra)
}

// Recordatorios de cita (modelo del video): confirmación al agendar,
// recordatorio 8 horas antes y aviso 1 hora antes.
export function tareasCita(lead, clienteId, empresa, fechaCita) {
  const hora = fechaCita.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const cuando = fechaCita.toLocaleString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
  const base = { cliente_id: clienteId, lead_id: lead.id, canal: 'whatsapp', estado: 'pendiente' }
  return [
    {
      ...base,
      tipo: 'confirmacion',
      programada_para: new Date().toISOString(),
      payload: plantilla('cita_agendada', lead, empresa, cuando),
    },
    {
      ...base,
      tipo: 'recordatorio',
      programada_para: new Date(fechaCita.getTime() - 8 * 3600000).toISOString(),
      payload: plantilla('recordatorio', lead, empresa, hora),
    },
    {
      ...base,
      tipo: 'recordatorio',
      programada_para: new Date(fechaCita.getTime() - 1 * 3600000).toISOString(),
      payload: plantilla('recordatorio', lead, empresa, hora),
    },
  ]
}

// Tareas de nurture que se crean cuando entra un lead por el formulario.
// Cadencia intensiva de 4 semanas (modelo Concrete AI): confirmación
// inmediata y seguimientos a 1, 2, 4, 7, 14, 21 y 28 días.
export function tareasNurture(lead, clienteId, empresa) {
  const dias = [0, 1, 2, 4, 7, 14, 21, 28]
  return dias.map((d, i) => ({
    cliente_id: clienteId,
    lead_id: lead.id,
    tipo: i === 0 ? 'confirmacion' : 'seguimiento',
    canal: 'whatsapp',
    programada_para: new Date(Date.now() + d * 86400000).toISOString(),
    estado: 'pendiente',
    payload:
      i === 0
        ? plantilla('confirmacion', lead, empresa)
        : plantilla('seguimiento', lead, empresa),
  }))
}
