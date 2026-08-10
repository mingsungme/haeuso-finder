// Inlines the app screenshots into slides.template.html and writes slides.html.
// Screenshots live outside the repo (they're regenerated from the running app),
// so point SHOTS at wherever the captures are.
//   node portfolio/build.mjs [shotsDir]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.argv[2] ?? resolve(here, 'shots');

const asDataUri = (file) =>
  'data:image/jpeg;base64,' + readFileSync(resolve(SHOTS, file)).toString('base64');

const slots = {
  __IMG_MAP__: '01-map.jpg',
  __IMG_SELECTED__: '02-selected.jpg',
  __IMG_LIST__: '04-list.jpg',
  __IMG_DIRECTIONS__: '05-directions.jpg',
};

let html = readFileSync(resolve(here, 'slides.template.html'), 'utf8');
for (const [token, file] of Object.entries(slots)) {
  html = html.replaceAll(token, asDataUri(file));
}

const out = resolve(here, 'slides.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)}KB)`);
