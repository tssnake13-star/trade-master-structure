const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const SANS = 'Montserrat', INTER = 'Inter';
const U = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/';
const PHOTO_COVER = U + '23d4080e-IMG_5751.jpeg';
const PHOTO_LAST = U + 'aee64f59-IMG_2652.png';
const TRADES = [U + 'd7de6d46-IMG_9294.jpeg', U + '681dcbe8-IMG_9295.jpeg', U + '14b63bb1-IMG_9296.jpeg'];
const INK = '#141414', RED = '#E1241B', GREY = '#8E8A82', BODY = '#33312E';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/logo-diamond.png').toString('base64')}`;
const EMBR = 329 / 423;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
function bodyBlock(text, x, y, max, lh, size) { let s = '', cy = y; for (const l of wrap(text, max)) { s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${INTER}" font-weight="500" font-size="${size}" fill="${BODY}">${esc(l)}</text>`; cy += lh; } return s; }
function headline(lines, x, y, size, lh) { let s = '', cy = y; for (const ln of lines) { const inner = ln.map(p => `<tspan fill="${p.red ? RED : INK}">${esc(p.t)}</tspan>`).join(''); s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${SANS}" font-weight="800" font-size="${size}">${inner}</text>`; cy += lh; } return s; }
function logoTR(yLogo = 52) {
  const eh = 66, ew = eh * EMBR, lx = 1016 - 168 - 20 - ew, tx = lx + ew + 20;
  return `<image href="${EMB}" x="${lx}" y="${yLogo}" height="${eh}" width="${ew}"/>`
    + `<line x1="${tx - 12}" y1="${yLogo + 4}" x2="${tx - 12}" y2="${yLogo + eh - 4}" stroke="${INK}" stroke-width="2"/>`
    + `<text x="${tx}" y="${yLogo + 28}" font-family="${INTER}" font-weight="800" font-size="23" letter-spacing="1" fill="${INK}">TRADE</text>`
    + `<text x="${tx}" y="${yLogo + 58}" font-family="${INTER}" font-weight="800" font-size="23" letter-spacing="1" fill="${INK}">LIKE TYO</text>`;
}
const redSpine = `<rect x="0" y="0" width="14" height="${H}" fill="${RED}"/>`;
const vlabel = (x, y, t) => `<g transform="translate(${x},${y}) rotate(-90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="21" letter-spacing="3" fill="${INK}">${esc(t)}</text></g>`;
const kickerT = (t) => `<text x="64" y="100" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">${esc(t)}</text><line x1="64" y1="132" x2="${W - 64}" y2="132" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.4"/>`;
const footer = (idx) => `<text x="64" y="1292" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ</text><text x="${W - 64}" y="1292" text-anchor="end" font-family="${SANS}" font-weight="900" font-size="30" fill="${INK}">${idx}</text>`;

// framed B&W dark portrait block
async function framedPortrait(src, w, h) {
  const pw = w * SCALE, ph = h * SCALE;
  const p = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).grayscale().normalise().linear(1.08, -4).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${14 * SCALE}" fill="#fff"/></svg>`);
  return sharp(p).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
// framed trade screenshot (square)
async function framedShot(src, size) {
  const px = size * SCALE;
  const p = await sharp(src).resize({ width: px, height: px, fit: 'cover' }).toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" rx="${16 * SCALE}" fill="#fff"/></svg>`);
  return sharp(p).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

// ---------- COVER ----------
async function cover() {
  const bx = 596, by = 250, bw = 432, bh = 700;
  const photo = await framedPortrait(PHOTO_COVER, bw, bh);
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  bg += `<text x="40" y="1230" font-family="${SANS}" font-weight="900" font-size="440" letter-spacing="-10" fill="#EFE9E2">23%</text>` + redSpine
    + `<rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 12}" fill="${RED}"/>` + `</svg>`;
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` + logoTR();
  fg += `<text x="64" y="250" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">РЕЗУЛЬТАТЫ · 18 МЕСЯЦЕВ</text>`;
  fg += headline([[{ t: 'Win rate ' }, { t: '23%', red: 1 }, { t: '.' }], [{ t: 'И счёт' }], [{ t: 'растёт.' }]], 60, 360, 72, 86);
  fg += `<text x="64" y="632" font-family="${INTER}" font-weight="500" font-size="27" fill="${GREY}">Низкий винрейт — не приговор.</text>`;
  fg += `<text x="64" y="668" font-family="${INTER}" font-weight="500" font-size="27" fill="${GREY}">Решает система.</text>`;
  fg += `<text x="110" y="1292" font-family="${SANS}" font-weight="900" font-size="30" letter-spacing="1" fill="${INK}">MMXXVI</text>`;
  fg += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ · 01 / 08</text>`;
  fg += `</svg>`;
  return sharp(await R(bg)).composite([{ input: photo, left: bx * SCALE, top: by * SCALE }, { input: await R(fg) }]);
}

// ---------- TRADE ----------
async function trade(idx, src, no) {
  const size = 900, sx = (W - size) / 2, sy = 210;
  const shot = await framedShot(src, size);
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>` + redSpine;
  bg += `<rect x="${sx - 6}" y="${sy - 6}" width="${size + 12}" height="${size + 12}" rx="20" fill="${RED}"/>` + `</svg>`;
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` + logoTR() + kickerT('СДЕЛКА ' + no + ' · ИЮНЬ 2026');
  fg += `<text x="${W / 2}" y="1200" text-anchor="middle" font-family="${INTER}" font-weight="700" font-size="26" fill="${INK}">риск на сделку — <tspan fill="${RED}">0.25%</tspan></text>`;
  fg += footer(idx + ' / 08');
  fg += `</svg>`;
  return sharp(await R(bg)).composite([{ input: shot, left: sx * SCALE, top: sy * SCALE }, { input: await R(fg) }]);
}

// ---------- LAST (stats + CTA + photo) ----------
async function last() {
  const bx = 596, by = 250, bw = 432, bh = 620;
  const photo = await framedPortrait(PHOTO_LAST, bw, bh);
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>` + redSpine
    + `<rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 12}" fill="${RED}"/>` + `</svg>`;
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` + logoTR() + kickerT('ХОТИТЕ ТАК ЖЕ?');
  fg += headline([[{ t: 'Торговать' }], [{ t: 'системно', red: 1 }, { t: '.' }]], 60, 268, 64, 78);
  // stat lines (left column, left of photo)
  const stats = [['Win rate', '23%'], ['Доходность', '+112%'], ['Просадка', '−2.23%'], ['Риск / сделка', '0.25%']];
  let sy = 466;
  for (const [k, v] of stats) {
    fg += `<text x="64" y="${sy}" font-family="${INTER}" font-weight="600" font-size="25" fill="${GREY}">${esc(k)}</text>`;
    fg += `<text x="500" y="${sy}" text-anchor="end" font-family="${SANS}" font-weight="800" font-size="30" fill="${INK}">${esc(v)}</text>`;
    fg += `<line x1="64" y1="${sy + 18}" x2="500" y2="${sy + 18}" stroke="${INK}" stroke-opacity="0.10"/>`;
    sy += 62;
  }
  fg += `<rect x="64" y="762" width="446" height="86" rx="43" fill="${RED}"/>`;
  fg += `<text x="287" y="815" text-anchor="middle" font-family="${INTER}" font-weight="800" font-size="24" letter-spacing="1" fill="#FFFFFF">ССЫЛКА В ШАПКЕ ПРОФИЛЯ →</text>`;
  fg += `<text x="64" y="910" font-family="${SANS}" font-weight="900" font-size="40" fill="${INK}">@tradeliketyo</text>`;
  fg += `<text x="64" y="947" font-family="${INTER}" font-weight="600" font-size="21" fill="${GREY}">если торгуете всерьёз</text>`;
  fg += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${SANS}" font-weight="900" font-size="30" fill="${INK}">08 / 08</text>`;
  fg += `</svg>`;
  return sharp(await R(bg)).composite([{ input: photo, left: bx * SCALE, top: by * SCALE }, { input: await R(fg) }]);
}

(async () => {
  const jobs = [
    ['tp-01', cover()],
    ['tp-02', trade('02', TRADES[0], '01')],
    ['tp-03', trade('03', TRADES[1], '02')],
    ['tp-04', trade('04', TRADES[2], '03')],
    ['tp-08', last()],
  ];
  fs.mkdirSync('.carousel/out/web', { recursive: true });
  for (const [name, jobP] of jobs) {
    const img = await jobP;
    await img.png({ compressionLevel: 9 }).toFile(`.carousel/out/${name}.png`);
    await sharp(await img.png().toBuffer()).resize(1080, 1350).png({ compressionLevel: 9 }).toFile(`.carousel/out/web/${name}.png`);
    console.log('rendered', name);
  }
})();
