# Scraper de barberías — contacto en frío (gorros Mateo)

Saca contactos de barberías desde Google Maps y los deja en un CSV listo para
contactar por WhatsApp.

## Aviso honesto (léelo)

- Raspar Google Maps es **zona gris** de los Términos de Servicio de Google.
- Está pensado para **uso personal y a escala chica** (decenas de locales, no miles).
- **Corre en TU máquina, con navegador visible.** Desde un servidor / IP de datacenter,
  Google te tira CAPTCHA casi de inmediato.
- El HTML de Maps cambia cada tanto; si algún día deja de sacar datos, hay que
  ajustar los selectores. Es frágil por naturaleza.
- No lo conviertas en envío masivo automático de WhatsApp: te **banean el número**,
  que es justo tu canal de venta. Para 50–100 contactos, **envía a mano**.

## Requisitos

- Node.js 18+
- Se instala Chromium solo vía Playwright

## Instalación

```bash
cd scraper
npm install          # instala Playwright y descarga Chromium
```

## Uso

```bash
# búsqueda y objetivo por defecto: "barberia Vina del Mar", 100 fichas
npm run scrape

# personalizado: node scraper.js "<búsqueda>" <cantidad>
node scraper.js "barberia Vina del Mar" 80

# navegador visible (recomendado, menos bloqueos):
HEADLESS=false node scraper.js "barberia Vina del Mar" 80

# cambiar archivo de salida:
OUT=vina.csv node scraper.js "barberia Vina del Mar" 80
```

## Salida — `barberias.csv`

| columna | detalle |
|---|---|
| `nombre` | nombre del local |
| `telefono` | tal como lo publica Maps |
| `es_movil` | `si` / `no` (móvil chileno = `+56 9 XXXX XXXX`) |
| `whatsapp` | link `wa.me/...` armado (solo si es móvil) |
| `instagram` | si el perfil lo enlaza |
| `sitio_web` | web publicada |
| `direccion` | dirección |
| `google_maps_url` | ficha de origen |

Los **móviles quedan arriba** en el CSV — son los que sirven para WhatsApp.
Los fijos de Viña (`+56 32 ...`) quedan al final; sirven para llamar, no para wsp.

## Después del scraper

1. Abre el CSV, borra lo que no calce (peluquerías que no son barbería, duplicados).
2. Contacta **a mano**, uno por uno, con el mensaje del brief. Nada de bots.
3. Al dueño directo, tono neutro, mandas foto, no persigues.
