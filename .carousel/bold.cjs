const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2, CARD = 28;
const SAND = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/ff7b87a5-IMG_5806.jpeg'; // cover
const BW = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/b2ae6774-IMG_5751.jpeg';   // CTA
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald', SANS = 'Montserrat';
const OUT = '#141414', WHITE = '#F4F2EC', GREY = '#B4B1A9', MUT = '#86837C';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

const X = 40, Y = 40, CW = W - 80, CH = H - 80;

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
const NUM = /(~?\d+(?:[.,]\d+)?(?:[–-]\d+(?:[.,]\d+)?)?\s*%?)/g;
function bodyLine(line, x, y) {
  const segs = []; let last = 0, m; NUM.lastIndex = 0;
  while ((m = NUM.exec(line))) { if (m.index > last) segs.push({ t: line.slice(last, m.index) }); segs.push({ t: m[0], hl: 1 }); last = m.index + m[0].length; }
  if (last < line.length) segs.push({ t: line.slice(last) });
  const inner = (segs.length ? segs : [{ t: line }]).map(s => `<tspan font-weight="${s.hl ? 700 : 500}" fill="${s.hl ? WHITE : GREY}">${esc(s.t)}</tspan>`).join('');
  return `<text xml:space="preserve" x="${x}" y="${y}" font-family="${SANS}" font-size="27">${inner}</text>`;
}
function body(text, x, y, max = 50, lh = 38) { let s = '', cy = y; for (const ln of wrap(text, max)) { s += bodyLine(ln, x, cy); cy += lh; } return { svg: s, endY: cy }; }

// headline: lines = [{t, f:'g'|'s', size}]
function headline(lines, x, y) {
  let s = '', cy = y;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const fam = ln.f === 's' ? SERIF : GROTESK;
    const it = ln.f === 's' ? ' font-style="italic"' : '';
    s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${fam}" font-weight="700"${it} font-size="${ln.size}" fill="${WHITE}">${esc(ln.t)}</text>`;
    const next = lines[i + 1];
    cy += next ? (ln.size * 0.30 + next.size * 0.72) : ln.size * 0.34;
  }
  return { svg: s, endY: cy };
}

function topbar() {
  return `<text x="${X + 40}" y="${Y + 56}" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="1" fill="${GREY}">сохраняй <tspan fill="${MUT}">&amp;</tspan> подписывайся</text>`
    + `<image href="${EMB}" x="${X + CW - 40 - 50 * EMBR}" y="${Y + 24}" height="50" width="${50 * EMBR}"/>`;
}
function pill(label, cx) {
  const w = 24 + label.length * 15;
  return `<rect x="${X + 38}" y="${Y + CH - 108}" width="${w}" height="66" rx="33" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.6"/>`
    + `<text x="${X + 38 + w / 2}" y="${Y + CH - 65}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="25" fill="${WHITE}">${esc(label)}</text>`;
}
function counter(idx) { return `<text x="${X + CW - 40}" y="${Y + CH - 60}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="1" fill="${MUT}">${idx} — 08</text>`; }
function cardBorder() { return `<rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>`; }

const fgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`.replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');

// ---- text slide (dark card) ----
function textSlide({ idx, hl, sub, pillLabel = 'листай →' }) {
  const grad = `<defs><radialGradient id="d" cx="0.35" cy="0.22" r="0.9"><stop offset="0" stop-color="#272727"/><stop offset="1" stop-color="#151515"/></radialGradient></defs>`;
  const card = `<rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}" fill="url(#d)"/>`;
  let inner = grad + card + cardBorder() + topbar();
  const hb = headline(hl, X + 40, Y + 360);
  inner += hb.svg;
  if (sub) inner += body(sub, X + 40, hb.endY + 36, 50).svg;
  inner += pill(pillLabel) + counter(idx);
  return { type: 'text', fg: fgWrap(inner) };
}

// ---- photo slide ----
async function photoSlide({ idx, src, hl, sub, pillLabel, handle }) {
  let photo = await sharp(src).resize({ width: CW * SCALE, height: CH * SCALE, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .modulate({ brightness: 1.05, saturation: 1.04 }).linear(1.07, -4).sharpen({ sigma: 0.5 }).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW * SCALE}" height="${CH * SCALE}"><rect width="${CW * SCALE}" height="${CH * SCALE}" rx="${CARD * SCALE}" fill="#fff"/></svg>`);
  photo = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  let fg = `<defs><clipPath id="cc"><rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}"/></clipPath>
    <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.42" stop-color="#000" stop-opacity="0.05"/><stop offset="0.62" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></linearGradient></defs>`;
  fg += `<g clip-path="url(#cc)"><rect x="${X}" y="${Y}" width="${CW}" height="${CH}" fill="url(#sc)"/></g>`;
  fg += cardBorder() + topbar();
  // headline in LOWER zone (face stays clear)
  const hb = headline(hl, X + 40, Y + 770);
  fg += hb.svg;
  if (sub) fg += body(sub, X + 40, hb.endY + 30, 46).svg;
  if (handle) fg += `<text x="${X + 40}" y="${Y + CH - 150}" font-family="${SERIF}" font-weight="700" font-size="40" fill="${WHITE}">@tradeliketyo</text>`;
  fg += pill(pillLabel || 'листай →') + counter(idx);
  const base = await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${OUT}"/></svg>`);
  return { type: 'photo', out: sharp(base).composite([{ input: photo, left: X * SCALE, top: Y * SCALE }, { input: await R(fgWrap(fg)) }]) };
}

const PLAN = [];

// S1 hook (photo)
PLAN.push(() => photoSlide({ idx: '01', src: SAND, pillLabel: 'листай →',
  hl: [{ t: 'ВАШ ДЕПОЗИТ', f: 'g', size: 92 }, { t: 'уничтожает', f: 's', size: 90 }, { t: 'НЕ РЫНОК', f: 'g', size: 92 }],
  sub: 'А вы сами. В плохой момент.' }));

PLAN.push(() => textSlide({ idx: '02',
  hl: [{ t: 'ТРИ УБЫТКА', f: 'g', size: 96 }, { t: 'подряд —', f: 's', size: 92 }, { t: 'И ВЫ УДВАИВАЕТЕ', f: 'g', size: 70 }],
  sub: 'Увеличиваете лот, чтобы быстро вернуть потерянное. Через час минус больше, чем вся прибыль за прошлый месяц.' }));

PLAN.push(() => textSlide({ idx: '03',
  hl: [{ t: 'ДЕЛО НЕ', f: 'g', size: 100 }, { t: 'в знаниях', f: 's', size: 96 }],
  sub: 'Вы знаете правила. Вы нарушаете их ровно тогда, когда эмоция кричит громче логики.' }));

PLAN.push(() => textSlide({ idx: '04',
  hl: [{ t: 'РЕШЕНИЕ О РИСКЕ —', f: 'g', size: 68 }, { t: 'на холодную', f: 's', size: 84 }, { t: 'голову', f: 's', size: 84 }],
  sub: 'Один раз. А не в момент, когда рука уже тянется удвоить ставку.' }));

PLAN.push(() => textSlide({ idx: '05',
  hl: [{ t: 'РИСК РЕШАЕТ', f: 'g', size: 90 }, { t: 'система,', f: 's', size: 92 }, { t: 'А НЕ ВЫ', f: 'g', size: 90 }],
  sub: 'Размер риска в каждой сделке — 0.25–0.3% от депозита. Настолько мало, что даже десять убытков подряд вас не выбьют.' }));

PLAN.push(() => textSlide({ idx: '06',
  hl: [{ t: 'ВСТРОЕННЫЙ', f: 'g', size: 86 }, { t: 'предохранитель', f: 's', size: 76 }],
  sub: 'Недельный лимит ~4%, месячный ~8%. Подошли к лимиту — новые сделки блокируются автоматически. Закопать себя глубже вы физически не можете.' }));

PLAN.push(() => textSlide({ idx: '07',
  hl: [{ t: 'ХУДШАЯ ПРОСАДКА', f: 'g', size: 64 }, { t: 'за 17 месяцев —', f: 's', size: 70 }, { t: '2.23%', f: 'g', size: 150 }],
  sub: 'Плохая неделя больше не превращается в плохой месяц.' }));

// S8 CTA (photo)
PLAN.push(() => photoSlide({ idx: '08', src: BW, pillLabel: 'смотреть уроки →', handle: true,
  hl: [{ t: 'ТРИ УРОКА —', f: 'g', size: 82 }, { t: 'бесплатно', f: 's', size: 86 }],
  sub: 'Посмотрите, как система защищает капитал от вас же. Без риска и без обязательств. Ссылка в шапке профиля.' }));

(async () => {
  for (let i = 0; i < PLAN.length; i++) {
    const s = await PLAN[i]();
    const out = s.type === 'photo' ? s.out : sharp(await R(s.fg));
    const f = `.carousel/out/bold-${String(i + 1).padStart(2, '0')}.png`;
    await out.png({ compressionLevel: 9 }).toFile(f);
    console.log('rendered', f);
  }
})();
