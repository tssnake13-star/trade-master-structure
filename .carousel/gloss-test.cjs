const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2;
const MONO = 'JetBrains Mono', GROTESK = 'Oswald', SANS = 'Montserrat';
const BG = '#F3F0E9', INK = '#15110F', RED = '#E5231B', REDD = '#B0140D', GREEN = '#1FA85B', GREY = '#8C877E';
const PHOTO = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function card(x, y, w, h, rad = 18, fill = '#FFFFFF') {
  return `<rect x="${x + 3}" y="${y + 7}" width="${w}" height="${h}" rx="${rad}" fill="#000000" fill-opacity="0.10"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="${fill}"/>`;
}
function miniChart(x, y, w, h, dir) {
  const col = dir === 'up' ? GREEN : RED, n = 12; let pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; const v = dir === 'up' ? (0.15 + 0.7 * t + 0.08 * Math.sin(t * 9)) : (0.85 - 0.62 * t + 0.08 * Math.sin(t * 9)); pts.push([x + t * w, y + h - v * h]); }
  const poly = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '); const last = pts[pts.length - 1];
  return `<polyline points="${poly}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="6" fill="${col}"/>`;
}

async function feather(src, w, h) {
  const pw = w * SCALE, ph = h * SCALE;
  let buf = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).png().toBuffer();
  const ml = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.26" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  buf = await sharp(buf).composite([{ input: ml, blend: 'dest-in' }]).png().toBuffer();
  const mt = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.14" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  buf = await sharp(buf).composite([{ input: mt, blend: 'dest-in' }]).png().toBuffer();
  return buf;
}

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
s += `<rect width="${W}" height="${H}" fill="${BG}"/>`;
let dots = '<g fill="#000000" fill-opacity="0.05">';
for (let yy = 60; yy < H; yy += 46) for (let xx = 40; xx < W; xx += 46) dots += `<circle cx="${xx}" cy="${yy}" r="1.6"/>`;
dots += '</g>'; s += dots;
s += `<g stroke="${RED}" stroke-opacity="0.16" fill="none" stroke-width="1.5"><circle cx="980" cy="150" r="120"/><circle cx="980" cy="150" r="78"/><path d="M760 120 H880 L910 150"/></g>`;
s += `<defs><linearGradient id="redg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RED}"/><stop offset="1" stop-color="${REDD}"/></linearGradient></defs>`;

// top bar — bigger legible logo
s += `<image href="${EMB}" x="56" y="44" height="76" width="${76 * EMBR}"/>`;
s += `<text x="${W - 56}" y="98" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="2" fill="${RED}">ПОДПИШИСЬ</text>`;

// headline
s += `<text xml:space="preserve" x="56" y="262" font-family="${GROTESK}" font-weight="700" font-size="70" fill="${INK}">ВЫ ПРОВЕРЯЕТЕ ГРАФИК</text>`;
s += `<text xml:space="preserve" x="50" y="424" font-family="${GROTESK}" font-weight="700" font-size="172" fill="url(#redg)">40 РАЗ</text>`;
s += `<text xml:space="preserve" x="56" y="520" font-family="${GROTESK}" font-weight="700" font-size="84" fill="${INK}">В ДЕНЬ</text>`;
// banner
s += card(56, 556, W - 112, 90, 20, 'url(#redg)');
s += `<text x="84" y="612" font-family="${SANS}" font-weight="700" font-size="28" fill="#FFFFFF">И прибыльнее от этого не становитесь.</text>`;

// left combined before/after card
const lx = 56, lw = 496, cy0 = 690, ch = 470;
s += card(lx, cy0, lw, ch, 22);
s += `<text x="${lx + 28}" y="${cy0 + 56}" font-family="${GROTESK}" font-weight="700" font-size="38" fill="${RED}">ХАОС</text>`;
s += miniChart(lx + 28, cy0 + 78, lw - 56, 120, 'down');
s += `<line x1="${lx + 28}" y1="${cy0 + 232}" x2="${lx + lw - 28}" y2="${cy0 + 232}" stroke="#000000" stroke-opacity="0.08"/>`;
s += `<text x="${lx + 28}" y="${cy0 + 300}" font-family="${GROTESK}" font-weight="700" font-size="38" fill="${GREEN}">СИСТЕМА</text>`;
s += miniChart(lx + 28, cy0 + 322, lw - 56, 120, 'up');

// pill
s += card(56, H - 150, 210, 76, 38, 'url(#redg)');
s += `<text x="161" y="${H - 102}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="26" fill="#FFFFFF">листай →</text>`;
s += `</svg>`;

(async () => {
  const base = await R(s);
  const photo = await feather(PHOTO, 488, 700);
  await sharp(base).composite([{ input: photo, left: 592 * SCALE, top: 650 * SCALE }]).png().toFile('.carousel/out/gloss-cover-test.png');
  console.log('gloss cover done');
})();
