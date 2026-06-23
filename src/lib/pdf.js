import puppeteer from 'puppeteer';

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ]
    });
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
    await page.close();
  }
}

export async function cerrarBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}