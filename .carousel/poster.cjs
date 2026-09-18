const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const SANS = 'Montserrat', INTER = 'Inter';
const LIGHT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg'; // cover (light bg)
const DARK = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/281ba5d5-IMG_6817.jpeg';  // CTA (framed block)
const INK = '#141414', RED = '#E1241B', GREY = '#8E8A82', BODY = '#33312E', GHOST = '#EEECE6';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/logo-diamond.png').toString('base64')}`;
const EMBR = 329 / 423; // diamond emblem (w/h)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
const NUM = /(\d+[.,%]?\d*\s?%?)/g;
function bodyLine(line, x, y, size = 30) {
  const segs = []; let last = 0, m; NUM.lastIndex = 0;
  while ((m = NUM.exec(line))) { if (m.index > last) segs.push({ t: line.slice(last, m.index) }); segs.push({ t: m[0], red: 1 }); last = m.index + m[0].length; }
  if (last < line.length) segs.push({ t: line.slice(last) });
  const inner = (segs.length ? segs : [{ t: line }]).map(s => `<tspan fill="${s.red ? RED : BODY}" font-weight="${s.red ? 700 : 500}">${esc(s.t)}</tspan>`).join('');
  return `<text xml:space="preserve" x="${x}" y="${y}" font-family="${INTER}" font-size="${size}">${inner}</text>`;
}
function bodyBlock(text, x, y, max = 50, lh = 46, size = 30) { let s = '', cy = y; for (const l of wrap(text, max)) { s += bodyLine(l, x, cy, size); cy += lh; } return s; }
function headline(lines, x, y, size, lh) {
  let s = '', cy = y;
  for (const ln of lines) { const inner = ln.map(p => `<tspan fill="${p.red ? RED : INK}">${esc(p.t)}</tspan>`).join(''); s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${SANS}" font-weight="800" font-size="${size}">${inner}</text>`; cy += lh; }
  return s;
}
function logoTR(yLogo = 52) {
  const eh = 66, ew = eh * EMBR, lx = 1016 - 168 - 20 - ew;
  const tx = lx + ew + 20;
  return `<image href="${EMB}" x="${lx}" y="${yLogo}" height="${eh}" width="${ew}"/>`
    + `<line x1="${tx - 12}" y1="${yLogo + 4}" x2="${tx - 12}" y2="${yLogo + eh - 4}" stroke="${INK}" stroke-width="2"/>`
    + `<text x="${tx}" y="${yLogo + 28}" font-family="${INTER}" font-weight="800" font-size="23" letter-spacing="1" fill="${INK}">TRADE</text>`
    + `<text x="${tx}" y="${yLogo + 58}" font-family="${INTER}" font-weight="800" font-size="23" letter-spacing="1" fill="${INK}">LIKE TYO</text>`;
}
const vlabel = (x, y) => `<g transform="translate(${x},${y}) rotate(-90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="21" letter-spacing="3" fill="${INK}">TRADELIKETYO · ВЫПУСК 03</text></g>`;
const ghostWord = (word, y = 1342, size = 300) => `<text x="-20" y="${y}" font-family="${SANS}" font-weight="900" font-size="${size}" letter-spacing="-8" fill="${GHOST}">${esc(word)}</text>`;
// giant word split across two lines (fills empty space, fully readable)
const ghostSplit = (word) => {
  const n = word.length, a = word.slice(0, Math.ceil(n / 2)), b = word.slice(Math.ceil(n / 2));
  const fit = s => Math.floor((W - 90) / (s.length * 0.74));
  const size = Math.min(278, fit(a), fit(b));
  const y1 = 1018, y2 = y1 + Math.round(size * 0.86);
  return `<text x="${W / 2}" y="${y1}" text-anchor="middle" font-family="${SANS}" font-weight="900" font-size="${size}" letter-spacing="-4" fill="#E7E3DB">${esc(a)}</text>`
    + `<text x="${W / 2}" y="${y2}" text-anchor="middle" font-family="${SANS}" font-weight="900" font-size="${size}" letter-spacing="-4" fill="#E7E3DB">${esc(b)}</text>`;
};
const redSpine = `<rect x="0" y="0" width="14" height="${H}" fill="${RED}"/>`;

async function bwFeather(src, w, h) {
  const pw = w * SCALE, ph = h * SCALE;
  let p = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).grayscale().normalise().linear(1.12, -6).png().toBuffer();
  const fl = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.32" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  p = await sharp(p).composite([{ input: fl, blend: 'dest-in' }]).png().toBuffer();
  const fb = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.14" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  return sharp(p).composite([{ input: fb, blend: 'dest-in' }]).png().toBuffer();
}

// ---------- SLIDE 1 — COVER (approved) ----------
async function cover() {
  const fw = 580, fh = 1110, fx = 500, fy = 150;
  const photo = await bwFeather(LIGHT, fw, fh);
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  bg += `<polygon points="852,150 1030,150 968,452 790,452" fill="${RED}"/>`;
  bg += ghostWord('ХАОС', 800) + `</svg>`;
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` + logoTR();
  fg += `<text x="64" y="250" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">ТИШИНА ВМЕСТО ХАОСА</text>`;
  fg += headline([[{ t: 'Вы проверяете' }], [{ t: 'график ' }, { t: '40 раз', red: 1 }], [{ t: 'в день.' }]], 60, 358, 62, 72);
  fg += `<text x="64" y="572" font-family="${INTER}" font-weight="500" font-size="27" fill="${GREY}">И прибыльнее от этого не становитесь.</text>`;
  fg += `<g transform="translate(54,1150) rotate(-90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="4" fill="${INK}">АНАЛИЗ · ОЖИДАНИЕ · ИСПОЛНЕНИЕ</text></g>`;
  fg += `<text x="110" y="1292" font-family="${SANS}" font-weight="900" font-size="30" letter-spacing="1" fill="${INK}">MMXXV</text>`;
  fg += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ · 01 / 08</text>`;
  fg += `</svg>`;
  return sharp(await R(bg)).composite([{ input: photo, left: fx * SCALE, top: fy * SCALE }, { input: await R(fg) }]);
}

// ---------- CONTENT SLIDE ----------
function content({ idx, kicker, ghost, head, body }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  s += ghostWord(ghost) + redSpine;
  s += logoTR();
  s += `<text x="64" y="100" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">${esc(kicker)}</text>`;
  s += `<line x1="64" y1="132" x2="${W - 64}" y2="132" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.4"/>`;
  s += headline(head, 60, 268, 66, 80);
  const hy = 268 + 80 * (head.length - 1) + 90;
  s += bodyBlock(body, 64, hy, 50, 46);
  s += vlabel(46, 1160);
  s += `<text x="64" y="1292" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ</text>`;
  s += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${SANS}" font-weight="900" font-size="30" fill="${INK}">${idx} / 08</text>`;
  s += `</svg>`;
  return sharp(R(s).then ? null : null); // placeholder (unused)
}
function contentBuf({ idx, kicker, ghost, head, body }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  s += ghostSplit(ghost) + redSpine + logoTR();
  s += `<text x="64" y="100" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">${esc(kicker)}</text>`;
  s += `<line x1="64" y1="132" x2="${W - 64}" y2="132" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.4"/>`;
  s += headline(head, 60, 300, 72, 86);
  const hy = 300 + 86 * (head.length - 1) + 102;
  s += bodyBlock(body, 64, hy, 48, 48, 31);
  s += vlabel(46, 1170);
  s += `<text x="64" y="1292" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ</text>`;
  s += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${SANS}" font-weight="900" font-size="30" fill="${INK}">${idx} / 08</text>`;
  s += `</svg>`;
  return R(s);
}

// ---------- SLIDE 8 — CTA (framed B&W photo block) ----------
async function cta() {
  // framed B&W photo block on the right
  const bw = 432, bh = 620, bx = 584, by = 250;
  let photo = await sharp(DARK).resize({ width: bw * SCALE, height: bh * SCALE, fit: 'cover', position: 'top', kernel: 'lanczos3' }).grayscale().normalise().linear(1.1, -4).toBuffer();
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  s += ghostWord('РЕШЕНИЕ') + redSpine + logoTR();
  s += `<text x="64" y="100" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">ЧТО ДАЛЬШЕ</text>`;
  s += `<line x1="64" y1="132" x2="${W - 64}" y2="132" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.4"/>`;
  s += headline([[{ t: 'Три урока —' }], [{ t: 'бесплатно', red: 1 }]], 60, 268, 64, 78);
  s += bodyBlock('Откройте три бесплатных урока и посмотрите этот режим изнутри. Без обязательств.', 64, 448, 23, 44);
  // red button
  s += `<rect x="64" y="668" width="430" height="86" rx="43" fill="${RED}"/>`;
  s += `<text x="279" y="722" text-anchor="middle" font-family="${INTER}" font-weight="800" font-size="26" letter-spacing="1" fill="#FFFFFF">СМОТРЕТЬ УРОКИ →</text>`;
  s += `<text x="64" y="822" font-family="${SANS}" font-weight="900" font-size="42" fill="${INK}">@tradeliketyo</text>`;
  s += `<text x="64" y="860" font-family="${INTER}" font-weight="600" font-size="22" fill="${GREY}">ссылка в шапке профиля</text>`;
  // photo frame
  s += `<rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 12}" fill="${RED}"/>`;
  s += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${SANS}" font-weight="900" font-size="30" fill="${INK}">08 / 08</text>`;
  s += `</svg>`;
  return sharp(await R(s)).composite([{ input: photo, left: bx * SCALE, top: by * SCALE }]);
}

const SLIDES = [
  { fn: 'cover' },
  { idx: '02', kicker: 'ВАШ ДЕНЬ СЕЙЧАС', ghost: 'ТРЕВОГА', head: [[{ t: 'Это не вовлечённость —' }], [{ t: 'это ' }, { t: 'тревога', red: 1 }, { t: '.' }]], body: 'Глаза в мониторе с утра до ночи. Сделка открыта — и вы не можете думать ни о чём другом. Это не вовлечённость, а тревога, которая мешает трезво решать.' },
  { idx: '03', kicker: 'ЧТО ТАКОЕ СВОБОДА', ghost: 'СВОБОДА', head: [[{ t: 'Свобода — это' }], [{ t: 'не ' }, { t: 'безделье', red: 1 }, { t: '.' }]], body: 'Это не «ничего не делать». Это убрать из процесса всё, что не требует вашей головы, и оставить только решение.' },
  { idx: '04', kicker: 'ЧТО ЗАБИРАЕТ СИСТЕМА', ghost: 'РУТИНА', head: [[{ t: 'Рутину забирает' }], [{ t: 'система', red: 1 }, { t: '.' }]], body: 'Расчёт лота, выставление ордера, перевод в безубыток, контроль лимитов. Всё это рутина — её забирает система. Вам остаётся анализ и решение.' },
  { idx: '05', kicker: 'КАК ВЫГЛЯДИТ НЕДЕЛЯ', ghost: 'НЕДЕЛЯ', head: [[{ t: 'Всё решено' }], [{ t: 'заранее', red: 1 }, { t: '.' }]], body: 'Воскресенье — 30 минут на контекст рынка. Понедельник — скринер отбирает, куда смотреть. Со вторника по пятницу всё решено заранее. Вы живёте.' },
  { idx: '06', kicker: 'КТО ПРИНИМАЕТ РЕШЕНИЕ', ghost: 'РЕШЕНИЕ', head: [[{ t: 'Решение —' }], [{ t: 'за вами', red: 1 }, { t: '.' }]], body: 'Машина не торгует вместо вас. Она убирает рутину и не даёт нарушить ваши же правила в слабый момент. Решение по каждой сделке принимаете вы.' },
  { idx: '07', kicker: 'ЧЕСТНАЯ РАМКА', ghost: 'РЕЖИМ', head: [[{ t: 'Не кнопка.' }], [{ t: 'Режим', red: 1 }, { t: ' профи.' }]], body: 'Это не кнопка, которая печатает деньги. Это режим работы профессионала: концентрированный анализ вместо постоянного дёрганья, тихий контроль вместо хаоса.' },
  { fn: 'cta' },
];

(async () => {
  for (let i = 0; i < SLIDES.length; i++) {
    const sl = SLIDES[i];
    let img;
    if (sl.fn === 'cover') img = await cover();
    else if (sl.fn === 'cta') img = await cta();
    else img = sharp(await contentBuf(sl));
    const f = `.carousel/out/poster-${String(i + 1).padStart(2, '0')}.png`;
    await img.png({ compressionLevel: 9 }).toFile(f);
    console.log('rendered', f);
  }
})();
