import puppeteer from 'puppeteer';

let browserPromise;
// Se ejecuta dentro de Chrome sobre HTML ya escapado. No toma decisiones clínicas.
export function paginarReceta() {
  const iniciales = [...document.querySelectorAll('.page')];
  const filas = iniciales.flatMap(p => {
    const cols = p.querySelectorAll('.col');
    const izquierda = [...cols[0].querySelectorAll('tbody tr')];
    const derecha = [...cols[1].querySelectorAll('tbody tr')];
    return izquierda.map((r, i) => [r.cloneNode(true), derecha[i].cloneNode(true)]);
  });
  const plantilla = iniciales[0].cloneNode(true);
  plantilla.querySelectorAll('tbody').forEach(t => t.replaceChildren());
  iniciales.forEach(p => p.remove());
  const paginas = [];
  const nueva = () => {
    const p = plantilla.cloneNode(true); document.body.append(p); paginas.push(p); return p;
  };
  function sincronizar(p) {
    const cols = [...p.querySelectorAll('.col')];
    for (const sel of ['header', '.patient']) {
      const elementos = cols.map(c => c.querySelector(sel));
      elementos.forEach(el => { el.style.height = 'auto'; });
      const alto = Math.max(...elementos.map(el => el.getBoundingClientRect().height));
      elementos.forEach(el => { el.style.height = `${alto}px`; });
    }
    const left = [...cols[0].querySelectorAll('tbody tr')];
    const right = [...cols[1].querySelectorAll('tbody tr')];
    left.forEach((r, i) => {
      r.style.height = ''; right[i].style.height = '';
      const alto = Math.max(r.getBoundingClientRect().height, right[i].getBoundingClientRect().height);
      r.style.height = right[i].style.height = `${alto}px`;
    });
  }
  const cabe = p => p.scrollHeight <= 1123 &&
    p.querySelector('footer').getBoundingClientRect().bottom - p.getBoundingClientRect().top <= 1096;
  let p = nueva(), cantidad = 0;
  for (const par of filas) {
    if (cantidad === 5) { p = nueva(); cantidad = 0; }
    const agregar = () => p.querySelectorAll('tbody').forEach((t, i) => t.append(par[i]));
    agregar(); sincronizar(p);
    if (!cabe(p) && cantidad > 0) {
      par.forEach(r => r.remove()); sincronizar(p);
      p = nueva(); cantidad = 0; agregar(); sincronizar(p);
    }
    if (!cabe(p)) throw new Error('El texto de una fila excede el espacio disponible. Resume sus campos.');
    cantidad++;
  }
  paginas.forEach((pagina, i) => {
    pagina.querySelector('.page-number').textContent = `Página ${i + 1} de ${paginas.length}`;
  });
  return { paginas: paginas.length, medicamentos: filas.length };
}
export async function htmlRecetaAPdfBase64(html) {
  if (!browserPromise) browserPromise = puppeteer.launch({
    headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']
  }).catch(err => { browserPromise = null; throw err; });
  const browser = await browserPromise;
  const page = await browser.newPage();
  try {
    await page.setViewport({width:794,height:1123});
    await page.setContent(html, {waitUntil:'networkidle0'});
    await page.evaluate(paginarReceta);
    const buffer = await page.pdf({printBackground:true,width:'794px',height:'1123px',margin:{top:0,bottom:0,left:0,right:0}});
    return buffer.toString('base64');
  } finally { await page.close(); }
}
export async function cerrarBrowserReceta() {
  if (browserPromise) { const browser = await browserPromise; await browser.close(); browserPromise = null; }
}
