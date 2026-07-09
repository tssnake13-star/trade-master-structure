const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald', SANS = 'Montserrat';
const LIGHT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg';
const DARK = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/281ba5d5-IMG_6817.jpeg';
const EMB_INK = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMB_SIL = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();
const label = (t, col) => `<text x="${W / 2}" y="26" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="2" fill="${col}">${esc(t)}</text>`;

async function feather(src, w, h, dirs) {
  const pw = w * SCALE, ph = h * SCALE;
  let buf = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).png().toBuffer();
  if (dirs.includes('l')) { const m = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.26" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`); buf = await sharp(buf).composite([{ input: m, blend: 'dest-in' }]).png().toBuffer(); }
  if (dirs.includes('t')) { const m = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.14" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`); buf = await sharp(buf).composite([{ input: m, blend: 'dest-in' }]).png().toBuffer(); }
  return buf;
}

// ============ A — LIGHT EDITORIAL (paper, black + red, crop marks, chips) ============
async function variantA() {
  const BG = '#F4F1EA', INK = '#17120F', RED = '#D8261C', GREY = '#7E7A71';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>`;
  let dots = '<g fill="#000" fill-opacity="0.045">'; for (let y = 60; y < H; y += 48) for (let x = 44; x < W; x += 48) dots += `<circle cx="${x}" cy="${y}" r="1.5"/>`; s += dots + '</g>';
  // crop marks
  const cm = (x, y, fx, fy) => `<path d="M${x} ${y + fy * 34} L${x} ${y} L${x + fx * 34} ${y}" stroke="${INK}" stroke-width="3" fill="none"/>`;
  s += cm(40, 40, 1, 1) + cm(W - 40, 40, -1, 1) + cm(40, H - 40, 1, -1) + cm(W - 40, H - 40, -1, -1);
  s += `<image href="${EMB_INK}" x="64" y="64" height="58" width="${58 * EMBR}"/>`;
  s += `<text x="${W - 64}" y="104" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${RED}">ПОДПИШИСЬ</text>`;
  s += `<text xml:space="preserve" x="64" y="280" font-family="${GROTESK}" font-weight="700" font-size="78" fill="${INK}">ВЫ ПРОВЕРЯЕТЕ</text>`;
  s += `<text xml:space="preserve" x="64" y="360" font-family="${GROTESK}" font-weight="700" font-size="78" fill="${INK}">ГРАФИК <tspan fill="${RED}">40 РАЗ</tspan></text>`;
  s += `<text xml:space="preserve" x="64" y="440" font-family="${GROTESK}" font-weight="700" font-size="78" fill="${RED}">В ДЕНЬ</text>`;
  s += `<text x="64" y="510" font-family="${SANS}" font-weight="600" font-size="30" fill="${GREY}">И прибыльнее от этого не становитесь.</text>`;
  // chips
  const chip = (x, t) => { const w = 40 + t.length * 17; return `<rect x="${x}" y="560" width="${w}" height="64" rx="32" fill="#fff" stroke="${RED}" stroke-opacity="0.4" stroke-width="1.5"/><text x="${x + w / 2}" y="600" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="24" fill="${INK}">${esc(t)}</text>`; };
  s += chip(64, 'тревога') + chip(290, 'импульс') + chip(516, 'хаос');
  s += `<text x="64" y="${H - 80}" font-family="${SANS}" font-weight="700" font-size="28" fill="${RED}">→ листай</text>`;
  s += `<text x="64" y="${H - 200}" font-family="${GROTESK}" font-weight="700" font-size="300" fill="#000" fill-opacity="0.04">01</text>`;
  s += label('A · СВЕТЛЫЙ EDITORIAL', GREY) + `</svg>`;
  const base = await R(s);
  const photo = await feather(LIGHT, 470, 560, ['l', 't']);
  await sharp(base).composite([{ input: photo, left: 610 * SCALE, top: 660 * SCALE }]).png().toFile('.carousel/out/cover-var-A.png');
  console.log('A done');
}

// ============ B — CALM MINIMAL (тишина: airy, big photo, restrained type) ============
async function variantB() {
  const BG = '#ECEAE4', INK = '#1B1713', RED = '#C0392B', GREY = '#8B877E';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>`;
  s += `<image href="${EMB_INK}" x="72" y="72" height="54" width="${54 * EMBR}"/>`;
  s += `<text x="72" y="300" font-family="${MONO}" font-weight="600" font-size="22" letter-spacing="3" fill="${RED}">ТИШИНА ВМЕСТО ХАОСА</text>`;
  s += `<text xml:space="preserve" x="68" y="400" font-family="${SERIF}" font-weight="700" font-size="72" fill="${INK}">Вы проверяете</text>`;
  s += `<text xml:space="preserve" x="68" y="486" font-family="${SERIF}" font-weight="700" font-size="72" fill="${INK}">график</text>`;
  s += `<text xml:space="preserve" x="68" y="586" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="84" fill="${INK}">40 раз в день.</text>`;
  s += `<rect x="72" y="612" width="300" height="5" fill="${RED}"/>`;
  s += `<text x="72" y="690" font-family="${SANS}" font-weight="500" font-size="28" fill="${GREY}">И прибыльнее от этого</text>`;
  s += `<text x="72" y="728" font-family="${SANS}" font-weight="500" font-size="28" fill="${GREY}">не становитесь.</text>`;
  s += `<text x="72" y="${H - 76}" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="2" fill="${GREY}">@tradeliketyo</text>`;
  s += label('B · СПОКОЙНЫЙ МИНИМАЛ', GREY) + `</svg>`;
  const base = await R(s);
  // big photo right, full height, feather left
  const photo = await feather(LIGHT, 560, H, ['l']);
  await sharp(base).composite([{ input: photo, left: 520 * SCALE, top: 0 }]).png().toFile('.carousel/out/cover-var-B.png');
  console.log('B done');
}

// ============ C — BOLD DARK (series consistency: dark card, sans+italic, dark photo) ============
async function variantC() {
  const OUT = '#141414', WHITE = '#F4F2EC', GREY = '#B4B1A9', MUT = '#86837C', CARD = 28;
  const X = 40, Y = 40, CW = W - 80, CH = H - 80;
  let photo = await sharp(DARK).resize({ width: CW * SCALE, height: CH * SCALE, fit: 'cover', position: 'top', kernel: 'lanczos3' }).normalise().modulate({ brightness: 1.32, saturation: 1.12 }).linear(1.12, -2).gamma(1.1).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW * SCALE}" height="${CH * SCALE}"><rect width="${CW * SCALE}" height="${CH * SCALE}" rx="${CARD * SCALE}" fill="#fff"/></svg>`);
  photo = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><clipPath id="cc"><rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}"/></clipPath><linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.62" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></linearGradient></defs>`;
  fg += `<g clip-path="url(#cc)"><rect x="${X}" y="${Y}" width="${CW}" height="${CH}" fill="url(#sc)"/></g>`;
  fg += `<rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1.5"/>`;
  fg += `<text x="${X + 40}" y="${Y + 56}" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="1" fill="${GREY}">сохраняй <tspan fill="${MUT}">&amp;</tspan> подписывайся</text>`;
  fg += `<image href="${EMB_SIL}" x="${X + CW - 40 - 56 * EMBR}" y="${Y + 22}" height="56" width="${56 * EMBR}"/>`;
  fg += `<text xml:space="preserve" x="${X + 40}" y="${Y + 760}" font-family="${GROTESK}" font-weight="700" font-size="86" fill="${WHITE}">ВЫ ПРОВЕРЯЕТЕ</text>`;
  fg += `<text xml:space="preserve" x="${X + 36}" y="${Y + 850}" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="82" fill="${WHITE}">график</text>`;
  fg += `<text xml:space="preserve" x="${X + 40}" y="${Y + 940}" font-family="${GROTESK}" font-weight="700" font-size="86" fill="${WHITE}">40 РАЗ В ДЕНЬ</text>`;
  fg += `<text x="${X + 40}" y="${Y + 1000}" font-family="${MONO}" font-weight="500" font-size="26" fill="${GREY}">И прибыльнее от этого не становитесь.</text>`;
  fg += `<rect x="${X + 38}" y="${Y + CH - 108}" width="190" height="66" rx="33" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.6"/><text x="${X + 38 + 95}" y="${Y + CH - 65}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="25" fill="${WHITE}">листай →</text>`;
  fg += label('C · ТЁМНЫЙ BOLD (как серия)', MUT) + `</svg>`;
  const base = await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${OUT}"/></svg>`);
  await sharp(base).composite([{ input: photo, left: X * SCALE, top: Y * SCALE }, { input: await R(fg) }]).png().toFile('.carousel/out/cover-var-C.png');
  console.log('C done');
}

(async () => { await variantA(); await variantB(); await variantC(); })();
