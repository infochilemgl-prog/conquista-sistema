# NexoSolar Leads — Oferta y estructura de venta

Adaptación del modelo "Concrete AI" (Niv Kochavi) al mercado solar chileno.
El modelo: **tú eres la agencia, tu cliente es la empresa instaladora de
paneles solares, el lead es el dueño de casa** que llena `/captar`.

---

## 1. La Oferta Océano Azul

Fórmula: `[Resultado] en [Tiempo] o [Penalización para ti]`

> **"Te consigo X instalaciones residenciales vendidas en 90 días,
> o te devuelvo el 100% de mi fee + $300.000 por hacerte perder el tiempo.
> Firmado en contrato."**

- La **X la defines en la llamada de discovery**, no antes: le preguntas
  cuántas instalaciones hace al mes hoy, cuánto vale su instalación promedio
  y qué margen tiene. Con SUS números armas la garantía (Niv garantizó 18
  trabajos porque el prospecto dijo que cada uno valía $8-10k USD).
- Punto de partida conservador para Chile: **8–12 instalaciones en 90 días**.
- Un solo Océano Azul a la vez. No vendas "marketing", vende instalaciones
  firmadas.

## 2. Estructura de cobro

Igual que Niv: entrada + bloque de trabajo + retención.

| Componente | Monto referencia | Qué es |
|---|---|---|
| Programa de crecimiento 3 meses | $1.500.000 CLP (split-pay: $750k hoy, $750k a 30 días) | Tu fee. Incluye ads, landing, CRM, seguimiento |
| Ad spend | $25.000–30.000/día | Va DIRECTO a Meta, con la tarjeta DEL CLIENTE |
| Retención post-programa | $450.000/mes, cancelable | Mes a mes después de los 3 meses |

Regla: el ad spend nunca pasa por tu bolsillo. La tarjeta del cliente va
conectada a su Ads Manager. Tú cobras por el sistema y el resultado.

## 3. El cálculo ROI (la pizarra de la llamada)

Se hace EN VIVO con los números que el prospecto te dio en discovery.
Ejemplo conservador (verifica los números reales de tu prospecto):

```
10 instalaciones garantizadas
× $3.000.000 CLP promedio por instalación (3–5 kW residencial)
= $30.000.000 facturación en 3 meses

× 25% margen (su número, no el tuyo)
= $7.500.000 utilidad

− $2.550.000 ad spend (30k/día × ~85 días)
− $1.500.000 tu fee
= ~$3.450.000 utilidad neta adicional en 3 meses
≈ +$1.150.000/mes de utilidad extra, garantizado por contrato
```

Siempre el mínimo, siempre conservador. "Tenemos gente que hace mucho más,
pero te muestro lo peor que te puede pasar."

## 4. Los ads (qué se publica)

- **Formato ganador:** 4 imágenes en 1 — tres fotos de instalaciones reales
  del cliente + una foto de la cuadrilla. Personalidad + prueba de que es
  una empresa real.
- **El gancho:** la cuenta de la luz. En Chile el dolor es el alza de las
  tarifas eléctricas. Ángulo: *"¿Pagas más de $70.000 de luz al mes?
  Córtala de raíz con energía solar — evaluación gratis en tu casa"*.
- **Descuento:** si ofreces un descuento, que sea real (ej. descuento de
  lanzamiento por comuna, o monitoreo/mantención del primer año gratis).
  El margen lo proteges en el precio de lista, no inflando precios para
  simular rebajas.
- **Targeting:** radio de 25–30 km de la base del cliente, dueños de casa,
  intereses de hogar/mejoras/eficiencia energética, comunas de ingresos
  medios-altos (donde la boleta duele y el techo es propio).
- **Testimonios en la landing:** reales. Tus primeros los consigues con la
  oferta de entrada (punto 8). Pantallazos inventados te matan la
  credibilidad y el negocio; capturas reales de WhatsApp de clientes
  felices convierten igual de bien.

## 5. Calificación (ya está construida)

El formulario `/captar` ES el filtro de calificación de Niv, versión solar:

| Pregunta de Niv (concreto) | Campo NexoSolar |
|---|---|
| ¿Es dueño o arrienda? | `es_dueno` |
| ¿Qué tipo de propiedad? | `tipo_vivienda` (casa = calificado) |
| Ingreso del hogar / crédito | `tramo_boleta` (proxy chileno: boleta > $70k = puede pagar) |
| Scope del proyecto (sq ft) | `techo_sol` (viabilidad técnica) |
| ¿Qué tan pronto? | `plazo` (asap = caliente) |

Lead A+: dueño + casa + boleta sobre $70k + techo con sol + asap.
Esos se llaman en los primeros 5 minutos.

## 6. "Isabella" versión Chile = WhatsApp

En Chile el SMS está muerto; el canal es **WhatsApp**. Mismo guión de Niv:

1. **Primer toque** (al minuto de llegar el lead): "Hola [nombre], soy
   Isabella de [Empresa Solar]. Vimos que pediste tu evaluación gratis para
   bajar tu cuenta de luz. ¿Podemos pasar a medir tu techo esta semana?"
2. **Agendamiento:** "¿Prefieres mañana o tarde?" → día/hora → dirección.
3. **Confirmaciones:** al agendar, 8 horas antes y 1 hora antes
   ("respóndeme SÍ para confirmar").
4. **Nurture largo:** si no responde, seguimiento espaciado hasta 365 días.
   Ningún lead se escapa por las grietas.

Fase 1 manual (tú o una VA con el guión), fase 2 automatizado. La cita
creada cae en la tabla `citas` y el lead se mueve a "Cita agendada".

## 7. La llamada de venta (one-call close)

Escuchas el 80%. Tono calmado, consultivo — lo agresivo es para el
contenido, no para la llamada.

1. **Discovery:** ¿residencial o comercial? ¿cuántas instalaciones al mes?
   ¿valor promedio? ¿margen? ¿de dónde vienen tus clientes hoy?
2. **Meta:** "¿Cuántas instalaciones adicionales al mes harían que esto sea
   un éxito para ti?"
3. **Presentación corta** (<10 min): ads probados → landing con su logo →
   CRM con pipeline → Isabella/WhatsApp → sus citas llegan a su Google
   Calendar con nombre, teléfono, dirección y respuestas.
4. **ROI en pizarra** con sus números (punto 3).
5. **Cierre en la misma llamada:** precio → garantía por contrato →
   split-pay si duda → firma → "Bienvenido a la familia".

**Objeciones:**
- *"Ya compré leads y me quemé"* → "Por eso no vendemos leads compartidos:
  cada lead es exclusivo tuyo, con tu logo, tu marca, y además te lo dejo
  garantizado por contrato."
- *"Es caro"* → split-pay 50/50 + el cálculo de nuevo: "lo mínimo que
  ganas con nosotros es $X al mes, firmado."
- *"Lo quiero pensar"* → "¿Qué parte te genera duda?" → contrato + garantía
  + ventana de cancelación en la primera semana de setup.

## 8. Tus primeros 2 clientes (sin testimonios todavía)

Niv cerraba con testimonios en video. Tú aún no los tienes. Risk-reversal
de entrada:

- **Cliente 1–2:** setup muy bajo (ej. $300.000) o profit-share (0 de setup,
  20–25% de la utilidad de cada instalación cerrada con tus leads), **a
  cambio de testimonio en video + acceso a sus números** cuando funcione.
- **Cliente 3 en adelante:** oferta completa del punto 1–2, con los
  testimonios y pantallazos reales del pipeline como prueba.

## 9. Outreach (el Santo Grial)

- **Canal:** WhatsApp + Instagram DM a empresas instaladoras SEC
  (buscables: instaladores autorizados, empresas solares por región,
  Instagram de #energiasolarchile).
- **Volumen:** parte con 50 contactos reales al día. Sin excusas.
- **Script de apertura:**
  > "Hola, soy [nombre] de NexoSolar. Tenemos un sistema que le consigue
  > 8–12 instalaciones residenciales adicionales en 90 días a empresas
  > solares en [región] — garantizado por contrato o no pagas.
  > ¿Estarías abierto a una asociación?"
- Responde → **llamada inmediata** (warm call). No dejes enfriar.

## 10. KPIs del ciclo de 90 días

- Contactos/día: 50 (semana 1–2) → 100+ (con VA).
- Tasa de respuesta objetivo: 4%.
- Reuniones/semana: 3–5.
- Close rate objetivo: 30–40%.
- Meta ciclo 1: **2 clientes fundadores** (oferta de entrada) +
  **1 cliente full price**.
