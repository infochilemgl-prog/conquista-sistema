// NexoVolt Leads — procesador de tareas automáticas (FASE 3)
//
// Esta Edge Function se despliega cuando se conecte la WhatsApp Business API
// (o Twilio). Hasta entonces, el envío es semi-automático: el Dashboard
// muestra las tareas vencidas y se envían con un clic por wa.me.
//
// Despliegue (cuando toque):
//   supabase functions deploy procesar-tareas
//   supabase functions schedule procesar-tareas --cron "* * * * *"
//
// Variables requeridas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// WHATSAPP_TOKEN, WHATSAPP_PHONE_ID (cuando exista la API).

import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: tareas, error } = await supabase
    .from('tareas_automaticas')
    .select('*, leads(telefono, nombre, dnd_whatsapp)')
    .eq('estado', 'pendiente')
    .lte('programada_para', new Date().toISOString())
    .limit(50)

  if (error) return new Response(error.message, { status: 500 })

  let enviadas = 0
  for (const t of tareas ?? []) {
    // Respetar DND
    if (t.leads?.dnd_whatsapp) {
      await supabase.from('tareas_automaticas').update({ estado: 'cancelada' }).eq('id', t.id)
      continue
    }

    // TODO fase 3: enviar por WhatsApp Business API:
    // await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {...})
    // Por ahora la función solo existe como esqueleto y no envía nada.

    const enviado = false // cambiar a true cuando la API esté conectada
    if (enviado) {
      await supabase.from('tareas_automaticas').update({ estado: 'enviada' }).eq('id', t.id)
      await supabase.from('mensajes').insert({
        lead_id: t.lead_id,
        cliente_id: t.cliente_id,
        direccion: 'out',
        canal: t.canal,
        texto: t.payload ?? '',
        enviado_por: 'auto',
      })
      enviadas++
    }
  }

  return new Response(JSON.stringify({ pendientes: tareas?.length ?? 0, enviadas }), {
    headers: { 'content-type': 'application/json' },
  })
})
