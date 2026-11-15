# NexoVolt Leads

Panel de captación y gestión de leads para instaladores de paneles solares
en Chile. React + Vite + Tailwind + Supabase. Multi-tenant.
La especificación completa está en [`SPEC.md`](./SPEC.md).

## Rutas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/captar/:slug` | público | Formulario de captación con la marca del instalador |
| `/login` | público | Inicio de sesión |
| `/` | privado | Dashboard: métricas + mensajes por enviar |
| `/oportunidades` | privado | Pipeline Kanban con acciones y realtime |
| `/conversaciones` | privado | Mensajería 3 zonas (lista, hilo, panel contacto) |
| `/contactos` | privado | Tabla + carga manual + importación CSV |
| `/calendario` | privado | Vistas Día/Semana/Mes + mini-mes |
| `/ventas`, `/prospectos` | privado (agencia) | CRM de prospección de instaladores |

## Puesta en marcha

### 1. Supabase

1. Crea el proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → corre **`supabase/schema_v2.sql`** (⚠️ borra las tablas v1 si existían).
3. Corre **`supabase/ventas.sql`** si aún no existe el módulo de agencia.
4. (Opcional, demo) corre **`supabase/demo_seed.sql`** — crea el instalador
   `SolarAndes SpA` con slug `demo`, leads, conversaciones, citas y tareas.
   Es el mockup para la llamada de venta. Limpieza:
   `delete from clientes where slug = 'demo';`
5. Authentication → Users → **Add user** (tu email y contraseña).
6. SQL Editor, con el UUID de tu usuario:
   ```sql
   insert into perfiles (id, nombre, rol) values ('TU-UUID', 'Mateo', 'owner');
   ```

### 2. Local

```bash
cp .env.example .env   # pega tu Project URL y anon key (Settings → API)
npm install
npm run dev
```

Entra a `/login`, y prueba el formulario público en `/captar/demo`.

### 3. Vercel

Importa el repo → Root Directory **`nexosolar`** → framework Vite →
variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` → Deploy.
`vercel.json` ya trae el rewrite para React Router.

## Automatizaciones (cómo funcionan hoy)

- Lead entra por `/captar/:slug` → se crean tareas: **confirmación inmediata**
  y **seguimientos a 1, 2, 4 y 7 días** (`tareas_automaticas`).
- Se agenda una cita → se crea un **recordatorio 3 horas antes**.
- El **Dashboard** lista las tareas vencidas ("Mensajes por enviar"): un clic
  abre WhatsApp con la plantilla lista, marca la tarea como enviada y la
  registra en la conversación. Cero costo.
- Fase 3 (con ingresos): `supabase/functions/procesar-tareas/` es el esqueleto
  de la Edge Function con cron para envío 100% automático vía WhatsApp
  Business API.

## Multi-tenant

- `clientes` = instaladores (tenants). `perfiles.rol`: `owner` ve todo y puede
  cambiar de cliente desde la barra lateral; `installer` solo ve su cliente.
- RLS en todas las tablas filtra por `cliente_id`; `anon` solo puede insertar
  leads/tareas (formulario público) y leer el branding de `clientes`.

## Estructura

```
nexosolar/
├── SPEC.md                      # especificación del producto
├── supabase/
│   ├── schema_v2.sql            # esquema multi-tenant + RLS (correr este)
│   ├── ventas.sql               # módulo agencia (prospectos/actividades)
│   ├── demo_seed.sql            # datos demo (mockup de venta)
│   └── functions/procesar-tareas/  # Edge Function fase 3
└── src/
    ├── context/app.jsx          # sesión, perfil, cliente activo
    ├── components/Layout.jsx    # sidebar navy + menú móvil
    ├── components/LeadDetail.jsx
    ├── lib/ (labels, plantillas, ventas)
    └── pages/ (Dashboard, Oportunidades, Conversaciones, Contactos,
               Calendario, Captar, Login, Ventas, Prospectos)
```

## Pendiente por fase

- **Fase 2:** webhook Meta Lead Ads (`origen='Meta'`), Google Calendar OAuth
  (campo `google_event_id` ya existe).
- **Fase 3:** WhatsApp Business API + agendador IA (esqueleto listo).
