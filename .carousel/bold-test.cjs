const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2;
const PHOTO = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/ff7b87a5-IMG_5806.jpeg';
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald', SANS = 'Montserrat';
const OUT = '#1A1A1A', CARD = 28, WHITE = '#F4F2EC', GREY = '#B9B6AE', MUT = '#8E8B83';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

(async () => {
  const x = 40, y = 40, w = W - 80, h = H - 80;
  const X = x * SCALE, Y = y * SCALE, Wd = w * SCALE, Ht = h * SCALE;
  // photo -> card, rounded
  let photo = await sharp(PHOTO).resize({ width: Wd, height: Ht, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .modulate({ brightness: 1.06, saturation: 1.05 }).linear(1.08, -4).sharpen({ sigma: 0.5 }).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}"><rect width="${Wd}" height="${Ht}" rx="${CARD * SCALE}" ry="${CARD * SCALE}" fill="#fff"/></svg>`);
  photo = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  const base = await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${OUT}"/></svg>`);

  // foreground: scrim (clipped to card) + text
  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <clipPath id="cc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${CARD}"/></clipPath>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.72"/><stop offset="0.4" stop-color="#000" stop-opacity="0.18"/><stop offset="0.62" stop-color="#000" stop-opacity="0.32"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/>
      </linearGradient>
      <linearGradient id="lft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#cc)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#top)"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#lft)"/>
    </g>`;
  // card hairline border
  fg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${CARD}" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>`;
  // top bar
  fg += `<text x="${x + 40}" y="${y + 56}" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="1" fill="${GREY}">сохраняй <tspan fill="${MUT}">&amp;</tspan> подписывайся</text>`;
  fg += `<image href="${EMB}" x="${x + w - 40 - 52 * EMBR}" y="${y + 24}" height="52" width="${52 * EMBR}"/>`;
  // headline (sans caps + italic serif mix)
  fg += `<text xml:space="preserve" x="${x + 38}" y="${y + 300}" font-family="${GROTESK}" font-weight="700" font-size="104" fill="${WHITE}">ЭТО НЕ ПРО</text>`;
  fg += `<text xml:space="preserve" x="${x + 34}" y="${y + 392}" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="98" fill="${WHITE}">везение,</text>`;
  fg += `<text xml:space="preserve" x="${x + 38}" y="${y + 484}" font-family="${GROTESK}" font-weight="700" font-size="92" fill="${WHITE}">ЭТО ПРО СИСТЕМУ</text>`;
  // sub
  fg += `<text x="${x + 40}" y="${y + 560}" font-family="${SANS}" font-weight="500" font-size="27" fill="${GREY}">7 слайдов, которые меняют то,</text>`;
  fg += `<text x="${x + 40}" y="${y + 596}" font-family="${SANS}" font-weight="500" font-size="27" fill="${GREY}">как вы принимаете решения.</text>`;
  // pill button
  fg += `<rect x="${x + 38}" y="${y + h - 110}" width="190" height="68" rx="34" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.6"/>`;
  fg += `<text x="${x + 38 + 95}" y="${y + h - 66}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="26" fill="${WHITE}">листай →</text>`;
  // corner caption
  fg += `<text x="${x + w - 40}" y="${y + h - 52}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="${GREY}">система решает,</text>`;
  fg += `<text x="${x + w - 40}" y="${y + h - 28}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="${GREY}">а не эмоции</text>`;
  fg += `</svg>`;

  await sharp(base).composite([{ input: photo, left: X, top: Y }, { input: await R(fg) }]).png().toFile('.carousel/out/bold-cover-test.png');
  console.log('bold cover test done');
})();
