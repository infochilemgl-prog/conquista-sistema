// Scraper de barberias en Google Maps -> CSV
//
// Uso:
//   node scraper.js "barberia Vina del Mar" 100
//   HEADLESS=false node scraper.js "barberia Vina del Mar" 80
//
// AVISO: raspar Google Maps es una zona gris de sus terminos de servicio.
// Esto es para uso personal y a escala chica (decenas, no miles). Corre en TU
// maquina, con navegador visible (HEADLESS=false) para que Google no te frene.
// No lo conviertas en un bot masivo: te bloquea la IP y no vale la pena.

import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const QUERY = process.argv[2] || "barberia Vina del Mar";
const TARGET = Number(process.argv[3] || 100);
const HEADLESS = process.env.HEADLESS === "true"; // por defecto visible: menos bloqueos
const OUT = process.env.OUT || "barberias.csv";

// pausas modestas: para no reventar el endpoint y que la pagina alcance a cargar,
// no para "esconderse". A esta escala no hace falta mas.
const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// telefono chileno movil: +56 9 XXXX XXXX  |  fijo Valparaiso: +56 32 XXX XXXX
function normalizarTelefono(raw) {
  if (!raw) return { telefono: "", esMovil: false, whatsapp: "" };
  const digitos = raw.replace(/[^\d+]/g, "");
  // deja solo digitos, quita el +56 si viene
  let nacional = digitos.replace(/^\+?56/, "");
  const esMovil = /^9\d{8}$/.test(nacional);
  const whatsapp = esMovil ? `https://wa.me/56${nacional}` : "";
  return { telefono: raw.trim(), esMovil, whatsapp };
}

function toCSV(rows) {
  const cols = [
    "nombre",
    "telefono",
    "es_movil",
    "whatsapp",
    "instagram",
    "sitio_web",
    "direccion",
    "google_maps_url",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

async function aceptarConsentimiento(page) {
  // Google a veces muestra pantalla de consentimiento de cookies
  try {
    const botones = [
      'button[aria-label*="Aceptar todo"]',
      'button[aria-label*="Accept all"]',
      'form[action*="consent"] button',
    ];
    for (const sel of botones) {
      const b = page.locator(sel).first();
      if (await b.count()) {
        await b.click({ timeout: 3000 });
        await sleep(1500);
        return;
      }
    }
  } catch {
    /* si no hay, seguimos */
  }
}

async function recolectarUrls(page, target) {
  const urls = new Set();
  let sinCrecer = 0;

  const feed = page.locator('div[role="feed"]');
  await feed.waitFor({ timeout: 30000 });

  while (urls.size < target && sinCrecer < 6) {
    const antes = urls.size;

    const nuevas = await page.$$eval('div[role="feed"] a[href*="/maps/place/"]', (as) =>
      as.map((a) => a.href)
    );
    nuevas.forEach((u) => urls.add(u));

    // llegamos al final de la lista?
    const fin = await page
      .getByText(/Has llegado al final|You've reached the end/i)
      .count()
      .catch(() => 0);
    if (fin) break;

    // scroll dentro del panel de resultados
    await feed.evaluate((el) => el.scrollBy(0, el.scrollHeight));
    await sleep(rand(1200, 2200));

    sinCrecer = urls.size > antes ? 0 : sinCrecer + 1;
    process.stdout.write(`\r  recolectados: ${urls.size}   `);
  }
  console.log("");
  return [...urls].slice(0, target);
}

async function extraerLugar(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator("h1").first().waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(rand(600, 1200));

  return page.evaluate(() => {
    const t = (el) => (el ? el.textContent.trim() : "");

    const nombre = t(document.querySelector("h1"));

    // telefono: el data-item-id trae el numero crudo -> phone:tel:+569....
    let telefono = "";
    const telEl = document.querySelector('[data-item-id^="phone:tel:"]');
    if (telEl) {
      telefono = telEl.getAttribute("data-item-id").replace("phone:tel:", "");
    }

    const sitio =
      document.querySelector('a[data-item-id="authority"]')?.href || "";

    const dirEl = document.querySelector('[data-item-id="address"]');
    let direccion = "";
    if (dirEl) {
      const aria = dirEl.getAttribute("aria-label") || "";
      direccion = aria.replace(/^Direcci[oó]n:\s*/i, "").replace(/^Address:\s*/i, "") || t(dirEl);
    }

    const instagram =
      [...document.querySelectorAll("a")]
        .map((a) => a.href)
        .find((h) => /instagram\.com/i.test(h)) || "";

    return { nombre, telefono, sitio, direccion, instagram };
  });
}

async function main() {
  console.log(`Busqueda: "${QUERY}"  | objetivo: ${TARGET}  | headless: ${HEADLESS}`);
  const browser = await chromium.launch({ headless: HEADLESS });
  const ctx = await browser.newContext({
    locale: "es-CL",
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(QUERY)}?hl=es`;
  await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await aceptarConsentimiento(page);

  console.log("Recolectando fichas de la lista...");
  const urls = await recolectarUrls(page, TARGET);
  console.log(`Fichas encontradas: ${urls.length}`);

  const rows = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const d = await extraerLugar(page, urls[i]);
      const tel = normalizarTelefono(d.telefono);
      rows.push({
        nombre: d.nombre,
        telefono: tel.telefono,
        es_movil: tel.esMovil ? "si" : "no",
        whatsapp: tel.whatsapp,
        instagram: d.instagram,
        sitio_web: d.sitio,
        direccion: d.direccion,
        google_maps_url: urls[i],
      });
      process.stdout.write(`\r  extraidos: ${i + 1}/${urls.length}  (${d.nombre})            `);
    } catch (e) {
      // una ficha rota no debe tumbar la corrida
      process.stdout.write(`\r  falla en ficha ${i + 1}: ${e.message}\n`);
    }
    await sleep(rand(800, 1600));
  }
  console.log("");

  // moviles primero (son los que sirven para WhatsApp)
  rows.sort((a, b) => (a.es_movil === b.es_movil ? 0 : a.es_movil === "si" ? -1 : 1));

  writeFileSync(OUT, toCSV(rows), "utf8");
  const moviles = rows.filter((r) => r.es_movil === "si").length;
  console.log(`\nListo -> ${OUT}`);
  console.log(`  total: ${rows.length}  |  con movil/WhatsApp: ${moviles}`);

  await browser.close();
}

main().catch((e) => {
  console.error("Error fatal:", e);
  process.exit(1);
});
