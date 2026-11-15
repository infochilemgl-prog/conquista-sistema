import { useState } from 'react'
import { supabase } from '../supabaseClient'

const TRAMOS = [
  { value: 'menos_40k', label: 'Menos de $40.000' },
  { value: '40_70k', label: '$40.000 – $70.000' },
  { value: '70_140k', label: '$70.000 – $140.000' },
  { value: 'mas_140k', label: 'Más de $140.000' },
]

const PLAZOS = [
  { value: 'asap', label: 'Lo antes posible' },
  { value: '30_dias', label: 'Dentro de 30 días' },
  { value: 'mas_1_mes', label: 'En más de un mes' },
]

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30'

function RadioGroup({ label, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-navy">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
              value === opt.value
                ? 'border-brand bg-brand/10 font-medium text-navy'
                : 'border-slate-300 bg-white hover:border-brand/50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-brand"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function Captar() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    es_dueno: null,
    tipo_vivienda: '',
    tramo_boleta: '',
    techo_sol: '',
    plazo: '',
    comuna: '',
    direccion: '',
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const setInput = (field) => (e) => set(field)(e.target.value)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Por favor completa tu nombre y teléfono.')
      return
    }
    setSending(true)
    const { error: err } = await supabase.from('leads').insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim() || null,
      es_dueno: form.es_dueno,
      tipo_vivienda: form.tipo_vivienda || null,
      tramo_boleta: form.tramo_boleta || null,
      techo_sol: form.techo_sol || null,
      plazo: form.plazo || null,
      comuna: form.comuna.trim() || null,
      direccion: form.direccion.trim() || null,
      estado: 'Lead',
      origen: 'Meta',
    })
    setSending(false)
    if (err) {
      setError('Hubo un problema al enviar. Intenta de nuevo en un momento.')
      console.error(err)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sun/20 text-3xl">
            ✅
          </div>
          <h1 className="mb-2 text-2xl font-bold text-navy">¡Listo!</h1>
          <p className="text-slate-600">
            Recibimos tus datos. Un asesor de NexoSolar te contactará muy
            pronto para evaluar tu ahorro con energía solar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy px-4 py-8">
      <div className="mx-auto max-w-lg">
        <header className="mb-6 text-center text-white">
          <div className="mb-2 text-4xl">☀️</div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Nexo<span className="text-sun">Solar</span>
          </h1>
          <p className="mt-2 text-slate-300">
            Descubre cuánto puedes ahorrar con paneles solares. Déjanos tus
            datos y te contactamos sin costo.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-xl"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Nombre *
            </label>
            <input
              className={inputCls}
              value={form.nombre}
              onChange={setInput('nombre')}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Teléfono *
            </label>
            <input
              className={inputCls}
              type="tel"
              value={form.telefono}
              onChange={setInput('telefono')}
              placeholder="+56 9 1234 5678"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Email
            </label>
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={setInput('email')}
              placeholder="tucorreo@ejemplo.cl"
            />
          </div>

          <RadioGroup
            label="¿Eres dueño(a) de la propiedad?"
            name="es_dueno"
            options={[
              { value: true, label: 'Sí' },
              { value: false, label: 'No' },
            ]}
            value={form.es_dueno}
            onChange={set('es_dueno')}
          />

          <RadioGroup
            label="¿Vives en casa o departamento?"
            name="tipo_vivienda"
            options={[
              { value: 'casa', label: 'Casa' },
              { value: 'departamento', label: 'Departamento' },
            ]}
            value={form.tipo_vivienda}
            onChange={set('tipo_vivienda')}
          />

          <RadioGroup
            label="¿Cuánto pagas de luz al mes?"
            name="tramo_boleta"
            options={TRAMOS}
            value={form.tramo_boleta}
            onChange={set('tramo_boleta')}
          />

          <RadioGroup
            label="¿Tu techo recibe sol directo?"
            name="techo_sol"
            options={[
              { value: 'si', label: 'Sí' },
              { value: 'no', label: 'No' },
              { value: 'no_se', label: 'No sé' },
            ]}
            value={form.techo_sol}
            onChange={set('techo_sol')}
          />

          <RadioGroup
            label="¿Para cuándo te interesa?"
            name="plazo"
            options={PLAZOS}
            value={form.plazo}
            onChange={set('plazo')}
          />

          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Comuna
            </label>
            <input
              className={inputCls}
              value={form.comuna}
              onChange={setInput('comuna')}
              placeholder="Ej: La Florida"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-navy">
              Dirección aproximada
            </label>
            <input
              className={inputCls}
              value={form.direccion}
              onChange={setInput('direccion')}
              placeholder="Calle y número (aprox.)"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-lg bg-sun px-4 py-3 text-base font-bold text-navy transition hover:brightness-105 disabled:opacity-60"
          >
            {sending ? 'Enviando…' : 'Quiero mi evaluación gratis'}
          </button>
          <p className="text-center text-xs text-slate-400">
            Tus datos solo se usan para contactarte. Sin spam.
          </p>
        </form>
      </div>
    </div>
  )
}
