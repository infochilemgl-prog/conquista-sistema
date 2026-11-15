export const ESTADOS_PROSPECTO = [
  'Por contactar',
  'Contactado',
  'Respondió',
  'Llamada agendada',
  'Propuesta enviada',
  'Cliente',
  'Descartado',
]

export const FUENTES = ['ACESOL', 'SEC', 'Google', 'Instagram', 'Referido', 'Otro']

export const META_DIARIA = 50

export const COLORES_ESTADO = {
  'Por contactar': 'bg-slate-200 text-slate-700',
  Contactado: 'bg-blue-100 text-blue-800',
  Respondió: 'bg-sun/30 text-amber-800',
  'Llamada agendada': 'bg-purple-100 text-purple-800',
  'Propuesta enviada': 'bg-orange-100 text-orange-800',
  Cliente: 'bg-green-100 text-green-800',
  Descartado: 'bg-red-100 text-red-700',
}

export const PLANTILLAS = [
  {
    id: 'apertura',
    nombre: 'Apertura',
    texto: (p) =>
      `Hola ${p.contacto_nombre || ''}, soy Mateo de NexoSolar Leads. Estoy armando una alianza con un par de instaladores solares de la región para entregarles cotizaciones de dueños de casa con boletas altas que, con el alza de tarifas, realmente quieren instalar paneles ahora. ¿Te interesaría recibir entre 8 y 12 cotizaciones calificadas al mes, o prefieres que te mande los detalles por acá?`.replace(
        'Hola , ',
        'Hola, '
      ),
  },
  {
    id: 'seguimiento',
    nombre: 'Seguimiento',
    texto: (p) =>
      `Hola ${p.contacto_nombre || ''}, Mateo de NexoSolar Leads de nuevo. Te escribí hace unos días por lo de las cotizaciones calificadas de dueños de casa para ${p.nombre_empresa}. Sigo con un cupo disponible este mes, con garantía por contrato. ¿Te mando los detalles?`.replace(
        'Hola , ',
        'Hola, '
      ),
  },
  {
    id: 'confirmacion',
    nombre: 'Confirmar llamada',
    texto: (p) =>
      `Hola ${p.contacto_nombre || ''}, te confirmo nuestra llamada de hoy. Te voy a mostrar el sistema con el que entregamos entre 8 y 12 cotizaciones calificadas al mes. Nos vemos en un rato.`.replace(
        'Hola , ',
        'Hola, '
      ),
  },
]
