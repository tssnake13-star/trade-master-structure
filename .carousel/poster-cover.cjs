const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const SANS = 'Montserrat', INTER = 'Inter';
const PHOTO = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg';
const INK = '#141414', RED = '#E1241B', GREY = '#8E8A82', GHOST = '#EEECE6';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

(async () => {
  // B&W portrait on the RIGHT, feather left + bottom into white
  const fw = 580, fh = 1110, fx = 500, fy = 150;
  const pw = fw * SCALE, ph = fh * SCALE;
  let photo = await sharp(PHOTO).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .grayscale().normalise().linear(1.12, -6).png().toBuffer();
  const fl = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.32" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: fl, blend: 'dest-in' }]).png().toBuffer();
  const fb = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.14" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: fb, blend: 'dest-in' }]).png().toBuffer();

  // background: white + light ghost word + red diagonal ONLY behind photo (no text there)
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#FFFFFF"/>`;
  bg += `<polygon points="852,150 1030,150 968,452 790,452" fill="${RED}"/>`;
  bg += `<text x="-18" y="800" font-family="${SANS}" font-weight="900" font-size="300" letter-spacing="-8" fill="${GHOST}">ХАОС</text>`;
  bg += `</svg>`;

  // foreground — ALL on white, dark/red text
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  // logo top-right (on white, above photo)
  fg += `<image href="${EMB}" x="770" y="56" height="54" width="${54 * EMBR}"/>`;
  fg += `<line x1="${770 + 54 * EMBR + 16}" y1="56" x2="${770 + 54 * EMBR + 16}" y2="114" stroke="${INK}" stroke-width="2"/>`;
  fg += `<text x="${770 + 54 * EMBR + 32}" y="82" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="1" fill="${INK}">TRADE</text>`;
  fg += `<text x="${770 + 54 * EMBR + 32}" y="110" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="1" fill="${INK}">LIKE TYO</text>`;
  // kicker
  fg += `<text x="64" y="250" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="3" fill="${RED}">ТИШИНА ВМЕСТО ХАОСА</text>`;
  // headline (left zone, dark on white)
  fg += `<text xml:space="preserve" x="60" y="358" font-family="${SANS}" font-weight="800" font-size="62" fill="${INK}">Вы проверяете</text>`;
  fg += `<text xml:space="preserve" x="60" y="430" font-family="${SANS}" font-weight="800" font-size="62" fill="${INK}">график <tspan fill="${RED}">40 раз</tspan></text>`;
  fg += `<text xml:space="preserve" x="60" y="502" font-family="${SANS}" font-weight="800" font-size="62" fill="${INK}">в день.</text>`;
  // sub
  fg += `<text x="64" y="572" font-family="${INTER}" font-weight="500" font-size="27" fill="${GREY}">И прибыльнее от этого не становитесь.</text>`;
  // vertical label — lower-left, on white, below headline (no overlaps)
  fg += `<g transform="translate(54,1150) rotate(-90)"><text x="0" y="0" font-family="${INTER}" font-weight="800" font-size="22" letter-spacing="4" fill="${INK}">АНАЛИЗ · ОЖИДАНИЕ · ИСПОЛНЕНИЕ</text></g>`;
  // footer
  fg += `<text x="110" y="1292" font-family="${SANS}" font-weight="900" font-size="30" letter-spacing="1" fill="${INK}">MMXXV</text>`;
  fg += `<text x="${W - 64}" y="1292" text-anchor="end" font-family="${INTER}" font-weight="700" font-size="22" letter-spacing="1" fill="${GREY}">→ ЛИСТАЙ · 01 / 08</text>`;
  fg += `</svg>`;

  await sharp(await R(bg)).composite([
    { input: photo, left: fx * SCALE, top: fy * SCALE },
    { input: await R(fg) },
  ]).png().toFile('.carousel/out/cover-poster.png');
  console.log('poster cover v3 done');
})();
