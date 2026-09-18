const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2;
const PORTRAIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png';
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const renderSvg = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

// ============ STYLE 01 — ACID QUANT ============
const LIME = '#C6F24E', CYAN = '#22D3EE', INK = '#06070A', WHITE = '#F4F6F0', MUT = '#7C8088';
function candles(x, y, w, h) {
  let r = 11; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const n = 22, step = w / n; let s = `<g opacity="0.9">`;
  let mid = y + h / 2;
  for (let i = 0; i < n; i++) {
    const cx = x + i * step + step / 2;
    mid += (rnd() - 0.5) * 26; mid = Math.max(y + 16, Math.min(y + h - 16, mid));
    const bh = 8 + rnd() * 26, up = rnd() > 0.42, col = up ? LIME : '#FF5C5C';
    const wick = bh + 10 + rnd() * 18;
    s += `<line x1="${cx}" y1="${mid - wick / 2}" x2="${cx}" y2="${mid + wick / 2}" stroke="${col}" stroke-width="2"/>`;
    s += `<rect x="${cx - step * 0.28}" y="${mid - bh / 2}" width="${step * 0.56}" height="${bh}" fill="${up ? col : 'none'}" stroke="${col}" stroke-width="2"/>`;
  }
  return s + `</g>`;
}
function corner(x, y, s, c, flipX, flipY) {
  const sx = flipX ? -1 : 1, sy = flipY ? -1 : 1;
  return `<path d="M${x} ${y + sy * s} L${x} ${y} L${x + sx * s} ${y}" fill="none" stroke="${c}" stroke-width="3"/>`;
}
async function acidQuant() {
  const pw = 470 * SCALE, ph = 1050 * SCALE, px = 610 * SCALE, py = 150 * SCALE;
  let photo = await sharp(PORTRAIT).resize({ width: pw, height: ph, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .modulate({ brightness: 1.05, saturation: 1.12 }).linear(1.06, 0).sharpen({ sigma: 0.6 }).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.32" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${INK}"/>`;
  for (let gx = 0; gx <= W; gx += 45) bg += `<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="${LIME}" stroke-opacity="0.045" stroke-width="1"/>`;
  for (let gy = 0; gy <= H; gy += 45) bg += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="${LIME}" stroke-opacity="0.045" stroke-width="1"/>`;
  bg += `</svg>`;

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">`;
  // top ticker
  fg += `<rect x="56" y="60" width="${W - 112}" height="46" fill="none" stroke="${LIME}" stroke-opacity="0.4" stroke-width="1.5"/>`;
  fg += `<text x="74" y="90" font-family="${MONO}" font-weight="700" font-size="22" fill="${LIME}">// TRADELIKETYO_SYSTEM</text>`;
  fg += `<text x="${W - 74}" y="90" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="20" fill="${CYAN}">14Y ▲ LIVE</text>`;
  // kicker
  fg += `<text x="60" y="230" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="3" fill="${LIME}">14 ЛЕТ В ТРЕЙДИНГЕ</text>`;
  // big grotesk headline
  const hl = [[{ t: '7 ВЕЩЕЙ,' }], [{ t: 'КОТОРЫЕ' }], [{ t: 'Я ' }, { t: 'УСВОИЛ', c: LIME }]];
  let cy = 360;
  for (const ln of hl) {
    fg += `<text xml:space="preserve" x="56" y="${cy}" font-family="${GROTESK}" font-weight="700" font-size="118" fill="${WHITE}">${ln.map(s => `<tspan fill="${s.c || WHITE}">${esc(s.t)}</tspan>`).join('')}</text>`;
    cy += 116;
  }
  fg += `<text x="60" y="${cy + 24}" font-family="${MONO}" font-weight="500" font-size="24" fill="${MUT}">на собственном счёте. без воды.</text>`;
  // crop corners around portrait
  fg += corner(606, 150, 34, LIME) + corner(1024, 150, 34, LIME, true) + corner(606, 1196, 34, LIME, false, true) + corner(1024, 1196, 34, LIME, true, true);
  // candle HUD bottom
  fg += candles(56, 1216, W - 320, 70);
  fg += `<text x="${W - 60}" y="1262" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="40" fill="${LIME}">@tradeliketyo</text>`;
  // style label
  fg += `<text x="56" y="1318" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${WHITE}">STYLE 01 — ACID QUANT</text>`;
  fg += `<text x="${W - 60}" y="1318" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="${MUT}">BOLD · FINTECH · 2025</text>`;
  fg += `</svg>`;

  const base = await renderSvg(bg);
  await sharp(base).composite([{ input: photo, left: px, top: py }, { input: await renderSvg(fg) }]).png().toFile('.carousel/out/style-01-acid-quant.png');
  console.log('style-01 done');
}

// ============ STYLE 02 — CINEMATIC NOIR ============
const GOLD = '#E8C77E', PAPER = '#F6F1E8';
async function cinematicNoir() {
  const fw = W * SCALE, fh = H * SCALE;
  let photo = await sharp(PORTRAIT).resize({ width: fw, height: fh, fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .modulate({ brightness: 1.02, saturation: 1.06 }).linear(1.08, -6).tint({ r: 255, g: 244, b: 224 }).sharpen({ sigma: 0.5 }).png().toBuffer();

  // cinematic overlays: warm top glow + heavy bottom gradient + vignette
  const ov = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="btm" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0.34" stop-color="#000" stop-opacity="0"/>
        <stop offset="0.72" stop-color="#070503" stop-opacity="0.72"/>
        <stop offset="1" stop-color="#050402" stop-opacity="0.96"/>
      </linearGradient>
      <radialGradient id="vg" cx="0.5" cy="0.4" r="0.8"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#btm)"/>
    <rect width="${W}" height="${H}" fill="url(#vg)"/></svg>`;

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  // top marks
  fg += `<text x="60" y="92" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="3" fill="${PAPER}" fill-opacity="0.85">@tradeliketyo</text>`;
  fg += `<text x="${W - 60}" y="92" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${GOLD}">EST. 14Y</text>`;
  fg += `<line x1="60" y1="112" x2="${W - 60}" y2="112" stroke="${PAPER}" stroke-opacity="0.18" stroke-width="1"/>`;
  // headline bottom
  fg += `<text x="60" y="${1006}" font-family="${MONO}" font-weight="600" font-size="22" letter-spacing="4" fill="${GOLD}">14 ЛЕТ В ТРЕЙДИНГЕ</text>`;
  fg += `<text x="56" y="${1108}" font-family="${SERIF}" font-weight="700" font-size="96" fill="${PAPER}">7 вещей,</text>`;
  fg += `<text x="56" y="${1196}" font-family="${SERIF}" font-weight="700" font-size="68" font-style="italic" fill="${PAPER}">которые я усвоил</text>`;
  fg += `<line x1="60" y1="1232" x2="380" y2="1232" stroke="${GOLD}" stroke-width="2"/>`;
  fg += `<text x="60" y="1276" font-family="${MONO}" font-weight="500" font-size="22" fill="${PAPER}" fill-opacity="0.8">на собственном счёте</text>`;
  // style label
  fg += `<text x="60" y="1320" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${GOLD}">STYLE 02 — CINEMATIC NOIR</text>`;
  fg += `<text x="${W - 60}" y="1320" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="${PAPER}" fill-opacity="0.55">EDITORIAL · LUXE</text>`;
  fg += `</svg>`;

  await sharp(photo).composite([{ input: await renderSvg(ov) }, { input: await renderSvg(fg) }]).png().toFile('.carousel/out/style-02-cinematic-noir.png');
  console.log('style-02 done');
}

(async () => { await acidQuant(); await cinematicNoir(); })();
