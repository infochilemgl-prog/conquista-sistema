# NexoSolar Leads

Sistema de captación y gestión de leads para paneles solares.
React + Vite + Tailwind CSS + Supabase.

## Rutas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/captar` | público | Formulario de captación (los ads apuntan acá) |
| `/login` | público | Inicio de sesión |
| `/` | privado | Pipeline Kanban |
| `/contactos` | privado | Tabla de leads + detalle |
| `/calendario` | privado | Citas agendadas |

## Puesta en marcha (paso a paso)

### 1. Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo **nexosolar**.
2. Ve a **SQL Editor → New query**, pega el contenido de `supabase/schema.sql` y dale **Run**.
3. Ve a **Authentication → Users → Add user** y crea tu usuario (email + contraseña). Con ese usuario entras al panel en `/login`.
4. En **Settings → API** copia el **Project URL** y la **anon key**.

### 2. Local

```bash
cd nexosolar
cp .env.example .env
# edita .env y pega tu Project URL y anon key
npm install
npm run dev
```

Abre http://localhost:5173/captar — llena el formulario y verifica en
**Supabase → Table Editor → leads** que el registro aparezca.

### 3. Deploy en Vercel

1. Sube el repo a GitHub (ya está, si estás leyendo esto desde GitHub).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En **Root Directory** selecciona `nexosolar`.
4. Framework preset: **Vite** (lo detecta solo).
5. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
6. **Deploy**. Tu formulario queda en `https://tu-proyecto.vercel.app/captar`.

El archivo `vercel.json` ya incluye el rewrite para que las rutas de React
Router funcionen al recargar la página.

### 4. Conectar los ads

Apunta tus campañas de Meta a `https://tu-dominio/captar`. Cada envío del
formulario inserta un lead con estado **Lead** en el pipeline.

## Estructura

```
nexosolar/
├── supabase/schema.sql      # tablas + políticas RLS
├── src/
│   ├── supabaseClient.js    # cliente Supabase (lee .env)
│   ├── App.jsx              # routing + protección de rutas
│   ├── lib/labels.js        # etiquetas y helpers compartidos
│   ├── components/Navbar.jsx
│   └── pages/
│       ├── Captar.jsx       # formulario público
│       ├── Login.jsx        # Supabase Auth
│       ├── Pipeline.jsx     # Kanban (@dnd-kit)
│       ├── Contactos.jsx    # tabla + panel de detalle
│       └── Calendario.jsx   # vista mensual de citas
```

## Pendiente (cuando haya ingresos)

- Sincronización con Google Calendar
- Automatizaciones de SMS/WhatsApp
