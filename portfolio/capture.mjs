// Captures app screenshots for the portfolio deck by driving headless Chrome
// over the DevTools protocol. Run the dev server first (npm run dev).
//
//   node portfolio/capture.mjs
//
// Writes PNGs to portfolio/shots/. Compress them to .jpg before building
// (see portfolio/README.md) — build.mjs inlines the .jpg files.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, 'shots');
const URL = process.env.APP_URL ?? 'http://localhost:5173';
const PORT = 9333;

// Adjust if Chrome lives elsewhere.
const CHROME =
  process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${resolve(OUT, '_profile')}`,
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await res.json()).find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error('Chrome DevTools target not found');
}

const ws = new WebSocket(await findTarget());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (!msg.id || !pending.has(msg.id)) return;
  const { resolve: ok, reject } = pending.get(msg.id);
  pending.delete(msg.id);
  msg.error ? reject(new Error(JSON.stringify(msg.error))) : ok(msg.result);
};

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((ok, reject) => {
    pending.set(id, { resolve: ok, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }))
    .result?.value;

async function shoot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data, 'base64'));
  console.log('saved', name);
}

const clickByText = (text) => `
  (function () {
    var b = Array.from(document.querySelectorAll('button'))
      .find(function (x) { return (x.textContent || '').indexOf(${JSON.stringify(text)}) > -1; });
    if (!b) return 'not-found';
    b.click();
    return 'clicked';
  })()
`;

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await send('Page.navigate', { url: URL });
// Places results arrive after the map settles; give them room.
await sleep(10000);

await shoot('01-map');

// Marker click needs a real mouse event — the map's own click handling
// doesn't respond to a synthetic click dispatched on the pin element.
const pinPoint = await evaluate(`
  (function () {
    var pin = Array.from(document.querySelectorAll('svg')).find(function (s) {
      if (!s.querySelector('path[fill="#2C5E43"]')) return false;
      var r = s.getBoundingClientRect();
      return r.width > 0 && r.top > 200 && r.bottom < 800;
    });
    if (!pin) return null;
    var r = pin.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) });
  })()
`);

if (pinPoint) {
  const { x, y } = JSON.parse(pinPoint);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: 'left',
      clickCount: 1,
      buttons: type === 'mousePressed' ? 1 : 0,
    });
    await sleep(80);
  }
  await sleep(2500);
  await shoot('02-selected');
} else {
  console.warn('no pin found — skipped 02-selected');
}

await evaluate(clickByText('목록'));
await sleep(1500);
await shoot('04-list');

await evaluate(clickByText('길찾기'));
await sleep(3500);
await shoot('05-directions');

ws.close();
chrome.kill();
console.log('done');
