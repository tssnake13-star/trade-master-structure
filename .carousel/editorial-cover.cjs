const sharp = require('sharp');
const fs = require('fs');
const W = 1080, H = 1350, SCALE = 2;
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', SANS = 'Montserrat';
const PHOTO = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/9837a4be-IMG_5805.jpeg';
const BG = '#F5F1E8', INK = '#1E1A16', ACC = '#C53A2B', CALM = '#2E6E55', GREY = '#8B857A';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

// settling line: chaotic left -> calm straight right
function settlingLine(x0, x1, midY, amp) {
  const n = 200; let pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + t * (x1 - x0);
    let d = 1 - t / 0.74; d = d < 0 ? 0 : d; d = d * d * (3 - 2 * d); // smoothstep decay
    const noise = amp * d * (0.62 * Math.sin(t * 41) + 0.3 * Math.sin(t * 73 + 1.3) + 0.42 * Math.sin(t * 19 + 0.6) + 0.2 * Math.sin(t * 113));
    pts.push([x, midY - noise]);
  }
  const poly = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return `<polyline points="${poly}" fill="none" stroke="url(#linegrad)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="${last[0]}" cy="${last[1]}" r="7" fill="${CALM}"/>`;
}

(async () => {
  // ---- photo with soft shadow + thin frame ----
  const fw = 408, fh = 560, fx = 596, fy = 196;
  const pw = fw * SCALE, ph = fh * SCALE;
  let photo = await sharp(PHOTO).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).modulate({ brightness: 1.03 }).linear(1.04, 0).toBuffer();
  const rmask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${10 * SCALE}" fill="#fff"/></svg>`);
  photo = await sharp(photo).composite([{ input: rmask, blend: 'dest-in' }]).png().toBuffer();
  // soft shadow
  let shadow = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw + 80 * SCALE}" height="${ph + 80 * SCALE}"><rect x="${40 * SCALE}" y="${40 * SCALE}" width="${pw}" height="${ph}" rx="${14 * SCALE}" fill="#000000" fill-opacity="0.22"/></svg>`)).blur(26).png().toBuffer();

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  s += `<defs>
    <radialGradient id="glow" cx="0.22" cy="0.16" r="0.9"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.6"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <linearGradient id="linegrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${ACC}"/><stop offset="0.6" stop-color="${ACC}"/><stop offset="1" stop-color="${CALM}"/></linearGradient>
  </defs>`;
  s += `<rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#glow)"/>`;

  // top bar
  s += `<image href="${EMB}" x="64" y="60" height="50" width="${50 * EMBR}"/>`;
  s += `<text x="${64 + 50 * EMBR + 16}" y="93" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="3" fill="${INK}">TRADELIKETYO</text>`;
  s += `<text x="${W - 64}" y="93" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${GREY}">ВЫПУСК 03</text>`;
  s += `<line x1="64" y1="124" x2="${W - 64}" y2="124" stroke="${INK}" stroke-opacity="0.14" stroke-width="1.4"/>`;

  // left headline column
  s += `<text x="64" y="250" font-family="${MONO}" font-weight="600" font-size="19" letter-spacing="3" fill="${ACC}">ТИШИНА ВМЕСТО ХАОСА</text>`;
  s += `<text xml:space="preserve" x="60" y="346" font-family="${SERIF}" font-weight="700" font-size="62" fill="${INK}">Вы проверяете</text>`;
  s += `<text xml:space="preserve" x="60" y="416" font-family="${SERIF}" font-weight="700" font-size="62" fill="${INK}">график</text>`;
  s += `<text xml:space="preserve" x="56" y="566" font-family="${SERIF}" font-weight="700" font-style="italic" font-size="150" fill="${ACC}">40 раз</text>`;
  s += `<text xml:space="preserve" x="60" y="648" font-family="${SERIF}" font-weight="700" font-size="62" fill="${INK}">в день.</text>`;
  s += `<text x="64" y="724" font-family="${SANS}" font-weight="500" font-size="26" fill="${GREY}">И прибыльнее от этого</text>`;
  s += `<text x="64" y="760" font-family="${SANS}" font-weight="500" font-size="26" fill="${GREY}">не становитесь.</text>`;

  // settling line motif (full width footer band)
  s += `<text x="64" y="980" font-family="${MONO}" font-weight="600" font-size="17" letter-spacing="2" fill="${ACC}">ХАОС</text>`;
  s += `<text x="${W - 64}" y="980" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" letter-spacing="2" fill="${CALM}">ТИШИНА</text>`;
  s += settlingLine(64, W - 64, 1070, 86);

  // footer
  s += `<line x1="64" y1="1200" x2="${W - 64}" y2="1200" stroke="${INK}" stroke-opacity="0.14" stroke-width="1.4"/>`;
  s += `<text x="64" y="1262" font-family="${SANS}" font-weight="700" font-size="28" fill="${ACC}">→ листай</text>`;
  s += `<text x="${W - 64}" y="1262" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="1" fill="${GREY}">01 / 08</text>`;

  // photo frame border (drawn over photo later) — add as overlay after composite
  s += `</svg>`;

  const base = await R(s);
  const frameBorder = await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${INK}" stroke-opacity="0.10" stroke-width="1.5"/></svg>`);
  await sharp(base)
    .composite([
      { input: shadow, left: (fx - 40) * SCALE, top: (fy - 28) * SCALE },
      { input: photo, left: fx * SCALE, top: fy * SCALE },
      { input: frameBorder },
    ]).png().toFile('.carousel/out/cover-editorial.png');
  console.log('editorial cover done');
})();
