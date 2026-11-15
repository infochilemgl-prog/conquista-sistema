export const ESTADOS = [
  'Lead',
  'Contactado',
  'Cita agendada',
  'Cotización entregada',
  'Trabajo ganado',
]

export const TRAMO_LABELS = {
  menos_40k: '< $40 mil',
  '40_70k': '$40–70 mil',
  '70_140k': '$70–140 mil',
  mas_140k: '> $140 mil',
}

export const PLAZO_LABELS = {
  asap: 'Lo antes posible',
  '30_dias': 'Dentro de 30 días',
  mas_1_mes: 'Más de un mes',
}

export const TECHO_LABELS = {
  si: 'Sí',
  no: 'No',
  no_se: 'No sabe',
}

export function formatCLP(n) {
  if (n == null || n === '') return '—'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function waLink(telefono, texto) {
  const digits = (telefono || '').replace(/\D/g, '')
  const full = digits.startsWith('56') ? digits : `56${digits.replace(/^0/, '')}`
  const base = `https://wa.me/${full}`
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}
