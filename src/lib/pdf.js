import puppeteer from 'puppeteer';

let browserPromise = null;

async function getBrowser() {
  if (browserPromise) {
    const current = browserPromise;
    const browser = await current;
    if (browser.isConnected()) return browser;
    if (browserPromise === current) browserPromise = null;
  }
  if (!browserPromise) {
    const pending = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }).then(browser => {
      browser.once('disconnected', () => {
        if (browserPromise === pending) browserPromise = null;
      });
      return browser;
    }).catch(error => {
      if (browserPromise === pending) browserPromise = null;
      throw error;
    });
    browserPromise = pending;
  }
  return browserPromise;
}

export async function htmlAPdfBase64(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      printBackground: true,
      width: '794px',
      height: '1123px',
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    return buffer.toString('base64');
  } finally {
    await page.close().catch(() => {});
  }
}

export async function cerrarBrowser() {
  if (browserPromise) {
    const pending = browserPromise;
    browserPromise = null;
    const browser = await pending;
    await browser.close();
  }
}
