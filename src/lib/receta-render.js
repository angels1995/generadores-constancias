import { generarQRBase64 } from './qr.js';
import { imagenBase64 } from './assets.js';

const e = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f = (v) => String(v).slice(0, 10).split('-').reverse().join('/');
export async function renderHtmlReceta(input, meta) {
  const qr = await generarQRBase64(meta.verificador_url);
  const logo = imagenBase64('logo_minsa_citt.png','receta_minsa_logo');
  const firmaSelloConfigurada = imagenBase64(null,'receta_minsa_firma_sello');
  const grupos = [];
  for (let i = 0; i < input.medicamentos.length; i += 5) grupos.push(input.medicamentos.slice(i, i + 5));
  const paciente = `<div class="patient"><b>Nombres y apellidos:</b><br>${e(input.paciente_nombre)}<br><b>DNI:</b> ${e(input.paciente_dni)}
    &nbsp; <b>Edad:</b> ${e(input.paciente_edad ?? '')}</div>`;
  const encabezado = (indicaciones) => `<header><img class="logo" alt="Logo de referencia MINSA" src="${e(logo)}"><h2>${e(input.hospital)}</h2>
    <div>${e([input.establecimiento_departamento, input.establecimiento_provincia, input.establecimiento_distrito].filter(Boolean).join(' / '))}</div>
    <h3>RECETA ÚNICA ESTANDARIZADA${indicaciones ? '<br>INDICACIONES' : ''}</h3><small>N.º ${e(meta.autog)}</small></header>${paciente}`;
  const firma = `<div class="signature"><div class="signature-art">
    <img class="firma-sello-image" alt="Espacio para imagen única de firma y sello" src="${e(firmaSelloConfigurada)}"></div>
    <div class="signature-caption">Firma y sello del profesional: pendiente de validación</div>
    <div class="professional">Profesional declarado: ${e(input.medico_nombre)} &nbsp; CMP: ${e(input.medico_cmp)}</div></div>`;
  const tablas = (items, indicaciones, pagina) => `<table><thead><tr>${(indicaciones ?
    ['Medicamento', 'Dosis', 'Vía', 'Frecuencia', 'Días'] :
    ['Medicamento / ATC', 'Concentración', 'Forma', 'Cant.']).map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>${items.map((m, n) => {
      const nombre = `<b>${pagina * 5 + n + 1}. ${e(m.nombre)}</b>`;
      return indicaciones ? `<tr><td>${nombre}${m.indicaciones ? `<div class="note">${e(m.indicaciones)}</div>` : ''}</td>
        <td>${e(m.dosis)}</td><td>${e(m.via)}</td><td>${e(m.frecuencia)}</td><td>${m.dias}</td></tr>` :
        `<tr><td>${nombre}<div class="note">${m.atc_codigo ? `<a href="${e(m.atc_fuente)}">ATC ${e(m.atc_codigo)}</a>` : 'ATC sin asignar'}</div></td>
        <td>${e(m.concentracion)}</td><td>${e(m.forma)}</td><td>${m.cantidad}</td></tr>`;
    }).join('')}</tbody></table>`;
  return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><style>
    *{box-sizing:border-box}html,body{margin:0;padding:0;font:11px Arial,sans-serif;color:#171717}
    @page{size:794px 1123px;margin:0}.page{width:794px;height:1123px;padding:28px 52px;position:relative;break-after:page;display:flex;flex-direction:column;gap:14px}
    .page:last-child{break-after:auto}.banner{padding:9px;min-height:33px;color:#555;text-align:right;font-size:8px;font-weight:bold}
    .columns{display:grid;grid-template-columns:1fr 1fr;gap:42px;flex:1}.col{min-width:0}header{min-height:212px;text-align:center;padding:9px 0}
    .logo{width:268px;max-width:100%;height:71px;object-fit:contain}h2{font-size:13px;margin:23px 0 7px;overflow-wrap:anywhere}h3{font-size:11px;margin:24px 0 6px;line-height:15px}header div{font-size:9px;overflow-wrap:anywhere}header small{font-size:8px}
    .patient{min-height:90px;padding-top:12px;line-height:16px;overflow-wrap:anywhere}.details{min-height:158px;font-size:10px;line-height:16px;padding:8px 0;overflow-wrap:anywhere}.details.indications-space{min-height:0;height:0;padding:0}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9px}th,td{border:1px solid #777;padding:5px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{height:32px;background:#fff;font-size:8px}tbody tr{height:36px}
    .col:first-child th:first-child{width:40%}.col:first-child th:nth-child(2){width:24%}.col:first-child th:nth-child(3){width:23%}.col:first-child th:last-child{width:13%}
    .col:last-child th:first-child{width:34%}.col:last-child th:nth-child(2){width:20%}.col:last-child th:nth-child(3){width:16%}.col:last-child th:nth-child(4){width:20%}.col:last-child th:last-child{width:10%}
    .note{font-size:8px;margin-top:6px;line-height:11px}.signature{margin-top:18px;font-size:9px;overflow-wrap:anywhere;break-inside:avoid}
    .signature-art{height:108px;display:flex;align-items:center;justify-content:center}.firma-sello-image{width:100%;max-width:294px;height:106.5px;object-fit:contain}
    .signature-caption{padding:3px 6px;font-size:8px}.professional{padding:4px 6px;line-height:12px}.dates{margin-top:14px;font-size:10px;line-height:17px}
    footer{border-top:1px solid #aaa;display:flex;align-items:center;gap:12px;padding-top:8px;min-height:94px;font-size:9px;line-height:14px}footer img{width:76px;height:76px;flex:0 0 76px}footer .text{flex:1;min-width:0;overflow-wrap:anywhere}footer .metadata{flex:0 0 145px;overflow-wrap:anywhere;font-size:8px}a{color:#254b6b}footer a{font-size:8px}
  </style></head><body>${grupos.map((items, i) => `<section class="page"><div class="banner">PENDIENTE DE VALIDACIÓN Y FIRMA DEL PROFESIONAL</div><div class="columns">
    <div class="col">${encabezado(false)}<div class="details"><b>USUARIO / SEGURO:</b> ${e(input.seguro)}<br><b>ATENCIÓN:</b> ${e(input.atencion)}<br><b>ESPECIALIDAD:</b> ${e(input.especialidad)}<br>
      <b>HISTORIA INTERNA:</b> ${e(input.historia_interna)}<br><b>Diagnóstico:</b> ${e(input.diagnostico)}<br><b>CIE-10:</b> ${e(input.cie10)}</div>
      ${tablas(items, false, i)}${firma}<div class="dates">Fecha de atención: ${f(input.fecha_atencion)}<br>Válido hasta (declarado): ${f(input.valido_hasta)}</div></div>
    <div class="col">${encabezado(true)}<div class="details indications-space"></div>
      ${tablas(items, true, i)}${firma}<div class="dates">Fecha de atención: ${f(input.fecha_atencion)}<br>Válido hasta (declarado): ${f(input.valido_hasta)}</div></div>
    </div><footer><img alt="QR del registro" src="${e(qr)}"><div class="text"><b>Verificación del registro del sistema</b><br>Este QR no acredita firma, habilitación profesional ni emisión por MINSA.
      <br><a href="${e(meta.verificador_url)}">${e(meta.verificador_url)}</a><br>ATC: referencia del WHO Collaborating Centre for Drug Statistics Methodology. Enlaces en cada código.</div>
      <div class="metadata">Emitido: ${e(meta.emitido_lima)}<br>Usuario: ${e(input.usuario)}<br><span class="page-number">Página ${i + 1} de ${grupos.length}</span></div></footer></section>`).join('')}</body></html>`;
}
