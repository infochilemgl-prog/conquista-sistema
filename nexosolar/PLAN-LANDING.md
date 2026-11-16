# NexoVolt Leads — Plan: landing de agencia + paneles

Documento de alineación · 16-11-2026 · para leer antes de construir.

---

## 1. El mapa completo: tres piezas, dos públicos

La confusión que hay que matar primero: **hay dos formularios distintos
porque hay dos públicos distintos.**

| Pieza | Público | Qué busca ese público | Estado |
|---|---|---|---|
| **A. Landing de agencia** (nexovoltleads.com) | Instaladores solares | Conseguir más clientes para SU empresa | ❌ Por construir (este plan) |
| **B. Tu panel** (rol owner) | Tú (Mateo) | Gestionar TU agencia: prospectos, ventas, y los leads de todos tus clientes | ✅ Construido |
| **C. Panel de clientes** (rol installer) | Tus clientes instaladores | Gestionar SUS leads (y solo los suyos) | ✅ Construido (multi-tenant) |
| **D. Formulario de dueños de casa** (/captar/:slug) | Dueños de casa | Cotizar paneles y ahorrar en la luz | ✅ Construido |

- El formulario con las preguntas de calificación (boleta, techo, dueño…)
  **no desaparece**: es la pieza D, vive en `/captar/:slug` y es para los
  dueños de casa que llegan de los anuncios de tus clientes. No es la
  puerta de entrada al panel ni va en la landing de agencia.
- La **landing de agencia (A)** tiene su PROPIO formulario, con preguntas
  de empresa: califica instaladores, no dueños de casa.
- El login del panel va en un link discreto de la landing ("Acceso
  clientes"), no como paso previo con preguntas.

## 2. Estructura de la landing (adaptada de la referencia Growth Engine)

Misma arquitectura de la referencia, contenido 100% NexoVolt:

### 2.1 Hero
- **H1:** "Consigue más instalaciones solares. Garantizado."
- **Subtítulo:** "Entregamos entre 8 y 12 cotizaciones calificadas al mes a
  empresas instaladoras en Chile — dueños de casa con techo propio y boleta
  sobre $40.000. 30 cotizaciones en 90 días o trabajamos gratis hasta cumplir."
- **Formulario lateral (CTA box):** Nombre · Empresa · Teléfono (WhatsApp) ·
  Email · Selector "¿Cuántas instalaciones haces al mes?" (0–2 / 3–5 / 6–10 / +10)
  · Botón destacado **"Agenda tu llamada"**.
- **Dónde cae el formulario:** directo a tu tabla `prospectos` (tu CRM de
  ventas), con fuente "Landing" y estado "Respondió". O sea: la landing
  alimenta tu módulo de Prospectos automáticamente.

### 2.2 Servicios (4 tarjetas)
1. **Anuncios en Meta** — campañas probadas con el ángulo del ahorro en la
   cuenta de luz, segmentadas a tu comuna.
2. **Leads calificados y exclusivos** — dueño + casa + boleta alta + techo
   con sol. Solo tuyos, nunca revendidos.
3. **Agendamiento por WhatsApp** — confirmación, recordatorios y
   seguimiento hasta 365 días para que ningún lead se pierda.
4. **Panel de gestión incluido** — pipeline, conversaciones y calendario de
   citas en tu teléfono.
- Botón por tarjeta: "Cuéntame más" (ancla al formulario).

### 2.3 Dolor / métricas (3 bloques)
- **+40–60%** — alza proyectada de las tarifas eléctricas a 2027–2028: tu
  cliente quiere cotizar AHORA.
- **99%** — de las casas en Chile aún no tiene paneles: mercado casi virgen.
- **5–10** — instaladores compitiendo por el mismo lead en los portales de
  leads compartidos. Los nuestros son solo tuyos.

### 2.4 Autoridad — "Sin humo. Solo instalaciones."
- Párrafo directo: no vendemos "marketing", entregamos cotizaciones con
  garantía por contrato; tú solo vas a cotizar y cerrar.
- **Mockup visual:** captura real del panel (pipeline con leads demo) — el
  mismo que mostramos en la llamada de venta.

### 2.5 Prueba social
- Hoy no hay testimonios chilenos → esta sección parte con el mockup del
  panel + la garantía en grande, y se reemplaza por logos y video
  testimonial apenas cierre el cliente fundador. (No se inventan logos ni
  testimonios: un pantallazo falso mata el negocio.)

### 2.6 Diferenciadores — "¿Por qué NexoVolt?"
- **Leads exclusivos** (no compartidos tipo portal).
- **Garantía por contrato** (30 cotizaciones en 90 días o gratis hasta cumplir).
- **Todo incluido** (ads + landing + agendador + panel; tú solo cotizas).
- **Sin permanencia** (mes a mes después del programa).

### 2.7 CTA final
- "¿Listo para llenar tu agenda de visitas técnicas?" + botón "Agenda tu llamada".

### 2.8 Footer
- Logo, WhatsApp de contacto, link discreto "Acceso clientes" → /login.

## 3. Diseño

- **Opción 1 (referencia):** fondo morado oscuro (`bg-purple-950`), CTAs
  rojo/naranja — el look Growth Engine.
- **Opción 2 (recomendada):** el mismo layout pero con TU marca: fondo navy
  `#0D2440`, acentos azul `#1F6FD6` y CTAs ámbar `#F5A623`. La landing, el
  panel y el formulario se ven como una sola empresa, que es lo que el
  instalador va a comprar.
- Mobile-first, una sola página, tipografía sans limpia. **Decisión tuya:
  ¿morado referencia o navy marca?**

## 4. Dónde se aloja y cómo se edita

| Opción | Costo | Edición | Veredicto |
|---|---|---|---|
| **Vercel (mismo repo)** | Gratis, sin marca ajena, dominio propio | Me pides el cambio y está en 1 minuto; el código es tuyo | ✅ Recomendada |
| **Wix gratis** | Gratis pero con publicidad de Wix y subdominio wix.com; el plan sin ads es pago | Editor visual, pero NO acepta pegar este código: habría que reconstruirla a mano en su editor | ❌ Se pierde el código y se ve menos profesional |

- Propuesta: la landing vive en el mismo proyecto, en la ruta pública `/`
  (el dashboard del panel se mueve a `/panel`). Un solo deploy en Vercel:
  `nexovoltleads.com` = landing, `nexovoltleads.com/login` = acceso
  clientes, `nexovoltleads.com/captar/:slug` = formularios de tus clientes.
- Si igual quieres probar Wix más adelante, la estructura de este plan se
  replica en su editor — pero el panel y los formularios SIEMPRE van a
  necesitar Vercel/Supabase, así que tendrías dos plataformas en vez de una.

## 5. Permisos (lo que mencionaste de los Gmail)

Ya está resuelto en el esquema v2 y queda igual:
- **Tú (owner):** ves todos los clientes y todos sus leads; cambias de
  cliente desde la barra lateral. Solo tú ves Ventas/Prospectos (tu CRM).
- **Tu cliente (installer):** entra con su login y la base de datos (RLS)
  solo le muestra SUS leads, SUS conversaciones, SUS citas. No puede ver
  correos, teléfonos ni nada de otros clientes, aunque lo intente por la API.
- Cuando sumes gente a TU equipo con acceso parcial, se agrega un rol
  intermedio (p. ej. "operador": ve clientes asignados, no ve Ventas ni
  los datos de los demás). Eso es un cambio chico sobre lo ya construido —
  se hace cuando exista esa persona.

## 6. Orden de construcción (cuando apruebes este plan)

1. Landing completa en el repo (ruta `/`, panel se mueve a `/panel`),
   formulario → `prospectos`, con la paleta que elijas.
2. Captura real del panel como mockup de la sección autoridad.
3. Deploy en Vercel + checklist para conectar el dominio.
4. (Después, cuando haya testimonios) reemplazo de la sección prueba social.

## 7. Decisiones que necesito de ti

1. **Paleta:** ¿morado de la referencia u navy de la marca NexoVolt?
2. **Hosting:** ¿confirmamos Vercel (recomendado) o insistes con Wix?
3. **Contacto del formulario:** además de caer en Prospectos, ¿quieres
   aviso al instante a tu WhatsApp/correo? (dime cuál).
4. **Dominio:** ¿ya compraste nexovoltleads.com (o .cl)? Si no, ¿cuál compro?
