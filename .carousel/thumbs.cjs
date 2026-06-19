const sharp = require('sharp');
const fs = require('fs');
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald';
const PORTRAIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png';
const SIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/e6e7d5fe-IMG_5804.jpeg';
const EMB_GOLD = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-gold.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const S = 2;
const R = (svg, w, h) => sharp(Buffer.from(svg), { density: 72 * S }).resize(w * S, h * S).png().toBuffer();

// ============ YOUTUBE THUMBNAIL 1280x720 ============
async function ytThumb() {
  const W = 1280, H = 720;
  const GOLD = '#FFB627', RED = '#FF4438', WHITE = '#F6F3ED', INK = '#08090C';
  // portrait right, feathered
  const pw = 560 * S, ph = H * S;
  let photo = await sharp(PORTRAIT).resize({ width: pw, height: ph, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .modulate({ brightness: 1.05, saturation: 1.12 }).linear(1.07, 0).sharpen({ sigma: 0.6 }).png().toBuffer();
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.36" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  photo = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${INK}"/>`;
  for (let x = 0; x <= W; x += 48) bg += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${GOLD}" stroke-opacity="0.04" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 48) bg += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${GOLD}" stroke-opacity="0.04" stroke-width="1"/>`;
  bg += `</svg>`;

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  // brand mark
  fg += `<image href="${EMB_GOLD}" x="56" y="46" height="58" width="${58 * EMBR}"/>`;
  fg += `<text x="${56 + 58 * EMBR + 16}" y="86" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="2" fill="${GOLD}">TRADELIKETYO</text>`;
  // headline
  fg += `<text xml:space="preserve" x="52" y="300" font-family="${GROTESK}" font-weight="700" font-size="62" fill="${WHITE}">ПОЧЕМУ</text>`;
  fg += `<text xml:space="preserve" x="48" y="430" font-family="${GROTESK}" font-weight="700" font-size="180" fill="${GOLD}">9 ИЗ 10</text>`;
  fg += `<text xml:space="preserve" x="52" y="540" font-family="${GROTESK}" font-weight="700" font-size="92" fill="${WHITE}">БЭКТЕСТОВ <tspan fill="${RED}">ВРУТ</tspan></text>`;
  // underline accent
  fg += `<rect x="54" y="566" width="520" height="8" fill="${RED}"/>`;
  // candle accents
  let r = 5; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  fg += `<g opacity="0.9">`;
  for (let i = 0; i < 9; i++) { const x = 56 + i * 30, up = rnd() > 0.5, c = up ? GOLD : RED, bh = 16 + rnd() * 30, my = 660; fg += `<rect x="${x}" y="${my - bh}" width="16" height="${bh}" fill="${c}"/>`; }
  fg += `</g>`;
  fg += `</svg>`;

  await sharp(await R(bg, W, H)).composite([{ input: photo, left: (W - 560) * S, top: 0 }, { input: await R(fg, W, H) }]).png().toFile('.carousel/out/yt-thumb-sample.png');
  console.log('yt thumb done');
}

// ============ SQUARE QUOTE POST 1080x1080 (Noir) ============
async function squarePost() {
  const W = 1080, H = 1080, M = 84;
  const BG = '#0B0806', PAPER = '#F4ECDE', GOLD = '#E8C77E', BODY = '#C7BEAF', MUTE = '#897F70';
  let bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="v" cx="0.5" cy="0.42" r="0.85"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient></defs><rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#v)"/></svg>`;

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  fg += `<image href="${EMB_GOLD}" x="${M}" y="78" height="60" width="${60 * EMBR}"/>`;
  fg += `<text x="${W - M}" y="118" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${MUTE}">ПРАВИЛО №3</text>`;
  fg += `<line x1="${M}" y1="170" x2="${W - M}" y2="170" stroke="rgba(244,236,222,0.16)" stroke-width="1"/>`;
  // big quote mark
  fg += `<text x="${M - 8}" y="360" font-family="${SERIF}" font-weight="900" font-size="220" fill="${GOLD}" fill-opacity="0.18">“</text>`;
  // quote
  fg += `<text xml:space="preserve" x="${M}" y="470" font-family="${SERIF}" font-weight="700" font-size="76" fill="${PAPER}">Риск-менеджмент</text>`;
  fg += `<text xml:space="preserve" x="${M}" y="560" font-family="${SERIF}" font-weight="700" font-size="76" font-style="italic" fill="${GOLD}">важнее</text>`;
  fg += `<text xml:space="preserve" x="${M}" y="650" font-family="${SERIF}" font-weight="700" font-size="76" fill="${PAPER}">точки входа.</text>`;
  // sub
  fg += `<text xml:space="preserve" x="${M}" y="760" font-family="${MONO}" font-weight="500" font-size="26" fill="${BODY}">Можно ошибаться в половине сделок</text>`;
  fg += `<text xml:space="preserve" x="${M}" y="800" font-family="${MONO}" font-weight="500" font-size="26" fill="${BODY}">и закрывать год в <tspan fill="${GOLD}">плюс</tspan>.</text>`;
  // footer
  fg += `<line x1="${M}" y1="${H - 150}" x2="${W - M}" y2="${H - 150}" stroke="rgba(244,236,222,0.16)" stroke-width="1"/>`;
  fg += `<text x="${M}" y="${H - 96}" font-family="${SERIF}" font-weight="700" font-size="40" fill="${PAPER}">@tradeliketyo</text>`;
  fg += `<text x="${W - M}" y="${H - 100}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="20" letter-spacing="1" fill="${MUTE}">14 лет в трейдинге</text>`;
  fg += `</svg>`;

  await sharp(await R(bg, W, H)).composite([{ input: await R(fg, W, H) }]).png().toFile('.carousel/out/post-square-sample.png');
  console.log('square post done');
}

(async () => { await ytThumb(); await squarePost(); })();
