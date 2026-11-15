# NexoVolt Leads — Especificación completa para Claude Code

> Documento de contexto para construir el panel de NexoVolt Leads.
> Versión 1 · 15-11-2026 · mercado: Chile · idioma del producto: español.

---

## 1. Qué es el producto

NexoVolt Leads es una agencia que genera clientes para **instaladores de paneles solares** en Chile. Este panel es la herramienta de fulfillment: capta los leads que generan los anuncios, los califica, los agenda por WhatsApp y los gestiona en un pipeline. Lo usan el dueño de la agencia (Mateo) y cada instalador cliente, desde el computador y el teléfono.

Modelo de referencia: Concrete AI (clon de GoHighLevel). Este panel replica esas pantallas adaptadas a Chile y a solar.

**Regla de producto:** todo gira en torno a mover un lead de "entró por un anuncio" a "el instalador cerró el trabajo". Cada pantalla debe acercar al lead a esa conversión.

---

## 2. Stack técnico

- **Frontend:** React + Vite + Tailwind CSS. Mobile-first (es una app que se usa desde el teléfono).
- **Backend / base de datos:** Supabase (Postgres + Auth + Row Level Security + Realtime + Storage).
- **Routing:** react-router-dom.
- **Kanban drag & drop:** @dnd-kit/core.
- **Hosting:** Vercel.
- **Integraciones (por fases, ver sección 9):** Google Calendar API, WhatsApp (semi-automático con enlaces `wa.me` primero; WhatsApp Business API / Twilio después), Meta Lead Ads (webhook).

**Principio de costos:** arrancar económico. Fase 1 usa solo lo gratis (Supabase, Vercel, enlaces `wa.me`). Las APIs con costo (WhatsApp Business, envíos SMS) se suman en fase 3, cuando haya ingresos.

---

## 3. Marca

- **Nombre:** NexoVolt Leads ("Volt" = energía; "LEADS" como subfrase chica).
- **Colores:** Navy `#0D2440`, Azul `#1F6FD6`, Volt/ámbar `#F5A623`, fondo `#F1F4F9`, texto `#17212F`.
- **Logo:** wordmark "Nexo" (navy) + "Volt" (azul) con un rayo como símbolo; "LEADS" debajo en caja alta espaciada.
- **Tono UI:** limpio, profesional, tipo CRM. Barra lateral navy, contenido claro.

---

## 4. Multi-tenant

El sistema se diseña **multi-tenant desde el esquema**, aunque al inicio opere con un solo instalador.

- Cada instalador es un `cliente` (tenant) con su propia subcuenta.
- Un usuario `owner` (Mateo) ve todos los clientes; un usuario `installer` ve solo su `cliente_id`.
- Todas las tablas de datos llevan `cliente_id` y las políticas RLS filtran por él.
- Al inicio: se crea un solo `cliente` y Mateo opera como owner. El multi-tenant real (login por instalador) se activa cuando haya 2+ clientes.

---

## 5. Esquema de base de datos

Ver `supabase/schema_v2.sql` (implementación completa con RLS).

Tablas: `clientes` (tenants), `perfiles` (usuarios con rol owner/installer),
`leads` (con `cliente_id`, calificación, estado, origen, asignado), `tags` +
`lead_tags`, `mensajes` (conversaciones in/out por canal), `citas` (con
`google_event_id`), `tareas_automaticas` (jobs de confirmación, recordatorio,
seguimiento y nurture).

Políticas RLS:
- El rol `anon` solo puede **insertar** en `leads` y `tareas_automaticas` (formulario público) y leer `clientes` (branding).
- Un usuario autenticado ve/edita filas donde `cliente_id` = su `cliente_id`, salvo el `owner`, que ve todas.

---

## 6. Módulos

### 6.1 Autenticación
Login con Supabase Auth (email/contraseña). Al entrar, se carga el `perfil` y su `cliente_id`. Rutas privadas protegidas. El formulario público de captación (`/captar/:clienteSlug`) es la única ruta sin login.

### 6.2 Dashboard / métricas
Tarjetas: leads totales, citas agendadas, trabajos ganados, valor en pipeline (suma de `valor_estimado`). Filtrables por rango de fecha.

### 6.3 Oportunidades (Pipeline Kanban)
- 5 columnas: Lead, Contactado, Cita agendada, Cotización entregada, Trabajo ganado.
- Cabecera de columna: nombre, conteo y suma de valor.
- Tarjeta: nombre, comuna, tramo de boleta, valor, origen, y **fila de íconos de acción**: llamar (`tel:`), WhatsApp (`wa.me`), etiqueta, nota, tarea, agendar.
- Arrastrar entre columnas actualiza `estado`. Click abre el detalle del lead.

### 6.4 Contactos
- Tabla filtrable (buscador por nombre/comuna/teléfono + filtro por estado).
- Botón **"+ Agregar contacto"** (carga manual) e importación CSV.
- Click en fila abre el detalle.

### 6.5 Detalle del lead
- Datos de calificación completos. Editable: estado, valor estimado, notas, **etiquetas**, **asignado a**.
- Botones: WhatsApp, Llamar, Email, Eliminar.
- Línea de tiempo de actividad (mensajes, citas, creación).

### 6.6 Conversaciones
Tres zonas: lista de conversaciones, hilo central con burbujas y envío, y panel de contacto a la derecha (teléfono, email, etiquetas, asignado, automatizaciones activas, interruptores DND por canal). Realtime con Supabase. En móvil: lista → hilo con botón "volver".

### 6.7 Calendario
Vistas Día / **Semana** / Mes (semana principal: días en columnas, horas en filas). Mini-mes al costado. Crear cita asociada a un lead (lo mueve a "Cita agendada"). Campo `google_event_id` preparado para la sync con Google Calendar (fase 2).

### 6.8 Formulario de captación (público)
Ruta `/captar/:clienteSlug` con la marca del instalador (logo y color desde `clientes`). Al enviar: inserta el lead con `origen='Formulario'` y crea las tareas automáticas de confirmación y nurture.

### 6.9 Automatizaciones
Ver sección 8.

---

## 7. Formulario de calificación (campos)

1. Nombre * · 2. Teléfono * · 3. Email · 4. ¿Eres dueño de la vivienda? ·
5. ¿Casa o departamento? · 6. ¿Cuánto pagas de luz al mes? (4 tramos) ·
7. ¿Techo con buen sol? (sí/no/no sé) · 8. ¿Para cuándo? (asap/30 días/+1 mes) ·
9. Comuna · 10. Dirección aproximada

Lead "calificado" = dueño + casa + boleta sobre $40.000 + dentro de cobertura + plazo < 90 días.

---

## 8. Automatizaciones y agendador

Motor fase 1 (económico): las `tareas_automaticas` pendientes y vencidas se muestran en el Dashboard como **"Mensajes por enviar"**, cada una con un clic que abre `wa.me` con la plantilla lista y la marca como enviada. Fase 3: Supabase Edge Function por cron + WhatsApp Business API (ver `supabase/functions/procesar-tareas/`).

- **Flujo A — Nuevo lead:** aviso interno al instalador.
- **Flujo B — Nurture:** confirmación inmediata y seguimientos a 1, 2, 4 y 7 días (extensible hasta 365).
- **Agendador:** plantillas con un clic por `wa.me` primero; asistente IA con WhatsApp Business API después.

Plantillas (en `src/lib/plantillas.js`):
- **Confirmación:** "Hola [nombre], gracias por tu interés en bajar tu cuenta de luz con paneles solares. Soy del equipo de [empresa]. ¿Te acomoda que coordinemos una evaluación de ahorro gratis esta semana?"
- **Recordatorio:** "Hola [nombre], te recuerdo tu visita de hoy a las [hora] para la evaluación de tus paneles solares. ¿Confirmas que estás disponible?"
- **Seguimiento:** "Hola [nombre], vi que estabas interesado en paneles solares. Con el alza de tarifas, realmente conviene cotizar ahora. ¿Quieres que te agende la evaluación gratis?"

---

## 9. Integraciones (orden)

1. Supabase (fase 1). 2. Enlaces `wa.me` y `tel:` (fase 1). 3. Meta Lead Ads webhook (fase 2). 4. Google Calendar OAuth (fase 2). 5. WhatsApp Business API / Twilio (fase 3, con ingresos).

---

## 10. Decisiones y supuestos vigentes

- Multi-tenant en el esquema; un solo instalador al inicio.
- Canal: WhatsApp (no SMS) para Chile.
- Agendador semi-automático primero; IA automática después.
- Fases 1 y 2 gratis; APIs con costo en fase 3.
- Idioma: español. Moneda: CLP.

---

## 11. Contexto de la campaña (vive en Meta, no en el panel)

Targeting: comuna del instalador + radio 20–25 km, dueños de casa, ingresos medios-altos, interés en hogar/construcción/ahorro energético. Gancho: "Deja de pagarle tanto a tu distribuidora. Evaluación de ahorro y cotización gratis." El formulario de Meta mapea a los campos de la sección 7.
