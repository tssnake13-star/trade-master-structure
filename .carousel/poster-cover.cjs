const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const SANS = 'Montserrat', INTER = 'Inter', SCRIPT = 'Caveat';
const PHOTO = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg';
const INK = '#111111', RED = '#E1241B', GREY = '#9A968E', GHOST = '#ECEAE6';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

(async () => {
  // B&W portrait, feather left + bottom into white
  const fw = 660, fh = 1080, fx = 430, fy = 150;
  const pw = fw * SCALE, ph = fh * SCALE;
  let photo = await sharp(PHOTO).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .grayscale().normalise().linear(1.12, -6).png().toBuffer();
  const fl = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.30" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: fl, blend: 'dest-in' }]).png().toBuffer();
  const fb = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.16" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: fb, blend: 'dest-in' }]).png().toBuffer();

  // background svg (red shapes + giant word) — drawn UNDER photo
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  bg += `<polygon points="120,250 330,250 230,900 20,900" fill="${RED}"/>`;
  bg += `<polygon points="830,170 1010,170 950,470 770,470" fill="${RED}"/>`;
  bg += `<text x="-12" y="1010" font-family="${SANS}" font-weight="900" font-size="300" letter-spacing="-6" fill="${GHOST}">ХАОС</text>`;
  bg += `</svg>`;

  // foreground svg (text/labels/logo) — drawn OVER photo
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  // logo top-right
  fg += `<image href="${EMB}" x="760" y="60" height="54" width="${54 * EMBR}"/>`;
  fg += `<line x1="${760 + 54 * EMBR + 14}" y1="58" x2="${760 + 54 * EMBR + 14}" y2="116" stroke="${INK}" stroke-width="2"/>`;
  fg += `<text x="${760 + 54 * EMBR + 30}" y="84" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="1" fill="${INK}">TRADE</text>`;
  fg += `<text x="${760 + 54 * EMBR + 30}" y="110" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="1" fill="${INK}">LIKE TYO</text>`;
  // left vertical label
  fg += `<g transform="translate(78,${H - 150}) rotate(-90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="26" letter-spacing="4" fill="${INK}">АНАЛИЗ · ОЖИДАНИЕ · ИСПОЛНЕНИЕ</text></g>`;
  // right vertical label
  fg += `<g transform="translate(${W - 54},300) rotate(90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="26" letter-spacing="4" fill="${INK}">ДИСЦИПЛИНА РЕШАЕТ ВСЁ</text></g>`;
  // script signature
  fg += `<text x="980" y="1120" text-anchor="end" font-family="${SCRIPT}" font-weight="700" font-size="92" fill="${RED}">Take Tyo —</text>`;
  // bottom-left: MMXXV + quote (the hook)
  fg += `<text x="64" y="1158" font-family="${SANS}" font-weight="900" font-size="58" letter-spacing="2" fill="${INK}">MMXXV</text>`;
  fg += `<text xml:space="preserve" x="64" y="1216" font-family="${INTER}" font-weight="800" font-size="27" fill="${INK}">ВЫ СМОТРИТЕ В ГРАФИК <tspan fill="${RED}">40 РАЗ</tspan> В ДЕНЬ —</text>`;
  fg += `<text x="64" y="1252" font-family="${INTER}" font-weight="800" font-size="27" fill="${INK}">И ПРИБЫЛЬНЕЕ ОТ ЭТОГО НЕ СТАНОВИТЕСЬ.</text>`;
  fg += `<text x="64" y="1300" font-family="${INTER}" font-weight="600" font-size="20" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ · 01 / 08</text>`;
  fg += `</svg>`;

  await sharp(await R(bg)).composite([
    { input: photo, left: fx * SCALE, top: fy * SCALE },
    { input: await R(fg) },
  ]).png().toFile('.carousel/out/cover-poster.png');
  console.log('poster cover done');
})();
