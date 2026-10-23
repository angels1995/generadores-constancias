import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import puppeteer from 'puppeteer';
import {htmlAPdfBase64, cerrarBrowser} from '../src/lib/pdf.js';

test('PDF se recupera tras fallo de lanzamiento y cierre inesperado de Chrome', async () => {
  const launch = puppeteer.launch.bind(puppeteer);
  let attempts = 0;
  let current;
  puppeteer.launch = async options => {
    attempts++;
    if (attempts === 1) throw new Error('Fallo de lanzamiento simulado');
    current = await launch(options);
    return current;
  };
  try {
    await assert.rejects(htmlAPdfBase64('<p>Prueba</p>'), /simulado/);
    const first = await htmlAPdfBase64('<p>Primer PDF</p>');
    assert.equal(Buffer.from(first, 'base64').subarray(0,5).toString(), '%PDF-');
    const disconnected = once(current, 'disconnected');
    current.process().kill('SIGKILL');
    await disconnected;
    const next = await htmlAPdfBase64('<p>PDF después de cierre inesperado</p>');
    assert.equal(Buffer.from(next, 'base64').subarray(0,5).toString(), '%PDF-');
    assert.equal(attempts, 3);
  } finally {
    await cerrarBrowser();
    puppeteer.launch = launch;
  }
});
