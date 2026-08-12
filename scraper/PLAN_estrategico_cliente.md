# Plan Estratégico — Sistema de venta mayorista online (Cliente G5, carrusel calle Valparaíso)

Cliente: local de ropa "G5", calle Valparaíso, Viña. Trabaja SOLO con marcas locales →
vende sin inmovilizar stock (sin riesgo de inventario). Por eso el motor correcto es
**venta por volumen / mayorista**, no retail unidad por unidad.

Vendedor/constructor: Mateo (Nexvore). Precio setup cerrado: **$497.000 CLP**.
Meta de caja: **cobrar antes del sábado 15-08**.

> Verdad operativa: antes del sábado se COBRA el depósito, no se entrega el sistema completo.
> Cerrar es de días; construir bien es de semanas. No prometas la tienda lista el sábado.

---

## FASE 0 — Cobrar antes del sábado (esto es lo urgente)

Días reales: **miércoles 12, jueves 13, viernes 14.**

- **Hoy (mié):** manda la propuesta y agenda verlo mañana en persona o por llamada.
- **Jueves (jue):** cierras y cobras **50% de depósito = $248.500** para arrancar. El otro
  50% al entregar la tienda publicando.
- **Viernes (vie):** confirmas pago, firmas alcance por escrito (aunque sea un WhatsApp claro),
  y arrancas el build.

Script de cobro (sin miedo, recurrente después):
> "El setup es $497. Partimos con la mitad para arrancar hoy y la otra mitad cuando te entrego
> la tienda vendiendo. ¿Te hago la transferencia de datos o el link de pago?"

**Ese depósito es tu dinero antes del sábado. Todo lo demás es entrega, no cobro.**

---

## LA ARQUITECTURA (el sistema en piezas)

Flujo completo: **Atención (ads) → Captura (tienda B2B) → Respuesta (n8n+Claude) →
Cierre/pedido → Despacho (Starken/Blue Express) → Recompra.**

### Pieza 1 — Shopify B2B / mayorista (NO genérica)

Lo que la separa de la tienda promedio:
- **Cuentas mayoristas con login:** precios de volumen ocultos hasta aprobar al cliente (RUT/giro).
- **Precios escalonados por cantidad:** ej. 1-11u, 12-49u, 50u+. El sistema aplica el precio solo.
- **Pedido mínimo** por cuenta mayorista.
- **Formulario de pedido rápido (order form):** el revendedor carga cantidades en una grilla, no
  agrega producto por producto. Clave para volumen.
- **Catálogo por marca local** (cada marca su colección).
- **Cotización de envío automática** en el carrito según comuna.
- App recomendada (sin pagar Shopify Plus): Wholesale Gorilla / B2B Wholesale Club sobre plan
  Shopify normal. (Plus B2B nativo es caro; no lo necesitas aún.)

### Pieza 2 — Motor de respuesta n8n + Claude (segmentado)

Esto es tu diferenciador real y lo que quieres aprender.
- **Entrada:** mensaje de WhatsApp / Instagram DM / formulario web.
- **n8n** recibe y llama a **Claude**, que clasifica en JSON:
  `{ tipo_cliente: mayorista|minorista, intencion: cotizar|comprar|consulta, producto, urgencia }`
- **Ramas automáticas:**
  - *Mayorista* → responde con lista de precios por volumen + pide cantidad y RUT + link a cuenta B2B.
  - *Minorista* → link directo a la tienda al detalle.
  - *Caliente / urgente* → avisa a Mateo para intervenir humano.
- **Registro:** cada lead a Google Sheets / CRM (nombre, tipo, producto, estado).
- **Seguimiento:** si no responde en 48h, n8n dispara recordatorio suave.

> Nota honesta de canal: WhatsApp automatizado en serio se hace con la **API oficial de WhatsApp
> Business** (vía Meta / 360dialog / Twilio) — tiene costo y aprobación, pero no te banean.
> Las APIs "no oficiales" (Evolution) son gratis pero arriesgan el número. Para arrancar rápido y
> barato: Instagram/Messenger API + formulario web, y sumas WhatsApp API cuando el volumen lo pague.

### Pieza 3 — Despacho

- Integración Starken / Blue Express / Chilexpress: cotización en carrito + generación de etiqueta.
- Automatización n8n: pedido pagado → genera etiqueta → correo de seguimiento al cliente.

### Pieza 4 — Publicidad pagada (el que trae la atención)

- **Retail (detalle):** campañas Advantage+ Shopping de Meta con catálogo → ventas directas.
- **Mayorista (B2B):** más fino. No hay targeting perfecto de "revendedores", así que:
  - Lookalike a partir de tus compradores actuales.
  - Intereses: dueños de tienda/boutique, emprendimiento, moda.
  - Campaña de **generación de leads** (formulario) → entran al motor n8n+Claude.
- El **presupuesto de pauta lo pone el cliente**, aparte de tu fee.

---

## EL FOCO: volumen / mayorista (por qué escala)

El cliente vende marcas locales sin comprar stock → cada pedido mayorista es margen sin riesgo
de inventario. Vender de a 1 es lento; vender de a 50 con un solo cierre es eficiencia pura.
El sistema entero está diseñado para empujar al comprador hacia el **pedido por volumen**:
precios escalonados que premian comprar más, order form rápido, y respuesta segmentada que
detecta al mayorista y lo trata distinto desde el primer mensaje.

---

## ROADMAP

**Antes del sábado (cobro):** Fase 0 completa → depósito $248.500 en tu cuenta.

**Semana 1 (build núcleo):**
- Shopify montada, plan elegido, dominio conectado.
- Catálogo de 1-2 marcas cargado (fotos, variantes, precios escalonados).
- Envíos y pagos integrados.
- Tienda vendiendo al detalle. → **Cobras el 50% restante.**

**Semana 2 (motor + mayorista):**
- App B2B + cuentas mayoristas + order form.
- n8n + Claude v1: clasifica y responde Instagram + formulario.
- Primera campaña de ads (retail + lead-gen mayorista).

**Semana 3+ (recurrente = tu caja mensual):**
- WhatsApp API si el volumen lo justifica.
- Optimización de ads, más marcas, reporte mensual.

---

## RUTA DE APRENDIZAJE (en orden, lo mínimo para no ahogarte)

1. **Shopify básico:** productos, variantes, colecciones, envíos, pagos. (1-2 días, es visual.)
2. **App de mayoreo:** instalar y configurar precios escalonados + cuentas. (medio día.)
3. **n8n:** conceptos de nodo/trigger/HTTP. Monta 1 flujo simple primero (form → Claude → Sheet).
4. **API de Claude:** un nodo HTTP con tu API key, prompt de clasificación en JSON. (yo te lo dejo escrito.)
5. **Meta Ads:** Business Manager, pixel, 1 campaña de catálogo + 1 de leads.

No aprendas todo antes de empezar. Aprendes la pieza justo antes de instalarla. Velocidad.

---

## LO QUE CONSTRUYO CONTIGO (siguiente paso)

Puedo dejarte hechos, listos para copiar/pegar:
1. **Prompt de clasificación de Claude** (el cerebro del motor n8n) + el JSON de un flujo n8n base.
2. **Estructura del catálogo Shopify** (plantilla de productos, colecciones por marca, tabla de
   precios escalonados) en CSV para importar de una.
3. **La propuesta en página visual** para mostrársela al cliente en el celular.

Dime por cuál parto y lo construyo ahora.
