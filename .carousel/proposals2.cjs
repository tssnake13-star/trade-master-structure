const sharp = require('sharp');

const W = 1080, H = 1350, SCALE = 2;
const PORTRAIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png';
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald', SANS = 'Montserrat';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();
const P = (opt) => sharp(PORTRAIT).resize(opt);

// ====================== STYLE 03 — NEO-BRUTALIST ======================
async function brutalist() {
  const PAPER = '#ECE8DE', BLACK = '#0B0B0B', COBALT = '#1F4DFF';
  const bw = 430 * SCALE, bh = 600 * SCALE, bx = 590 * SCALE, by = 540 * SCALE;
  const photo = await P({ width: bw, height: bh, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .modulate({ brightness: 1.04, saturation: 1.1 }).sharpen({ sigma: 0.5 }).png().toBuffer();

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  s += `<rect width="${W}" height="${H}" fill="${PAPER}"/>`;
  s += `<rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${BLACK}" stroke-width="10"/>`;
  // top bar
  s += `<rect x="12" y="12" width="${W - 24}" height="74" fill="${BLACK}"/>`;
  s += `<text x="44" y="62" font-family="${MONO}" font-weight="700" font-size="26" letter-spacing="2" fill="${PAPER}">TRADELIKETYO</text>`;
  s += `<text x="${W - 44}" y="62" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="26" fill="${COBALT}">★ 14Y</text>`;
  // headline
  s += `<text x="44" y="280" font-family="${MONO}" font-weight="700" font-size="24" fill="${BLACK}">14 ЛЕТ → 7 УРОКОВ</text>`;
  s += `<text xml:space="preserve" x="40" y="400" font-family="${GROTESK}" font-weight="700" font-size="128" fill="${BLACK}">7 ВЕЩЕЙ,</text>`;
  s += `<text xml:space="preserve" x="40" y="516" font-family="${GROTESK}" font-weight="700" font-size="128" fill="${BLACK}">КОТОРЫЕ</text>`;
  // cobalt block + word
  s += `<rect x="40" y="556" width="470" height="120" fill="${COBALT}"/>`;
  s += `<text xml:space="preserve" x="60" y="648" font-family="${GROTESK}" font-weight="700" font-size="118" fill="${PAPER}">УСВОИЛ</text>`;
  // portrait with hard offset shadow
  s += `<rect x="${590 + 16}" y="${540 + 16}" width="430" height="600" fill="${COBALT}"/>`;
  s += `</svg>`;
  let base = await R(s);
  // overlay border on photo after composite
  let over = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  over += `<rect x="590" y="540" width="430" height="600" fill="none" stroke="${BLACK}" stroke-width="8"/>`;
  over += `<text x="44" y="780" font-family="${MONO}" font-weight="600" font-size="26" fill="${BLACK}">на собственном счёте.</text>`;
  over += `<text x="44" y="816" font-family="${MONO}" font-weight="600" font-size="26" fill="${BLACK}">без воды.</text>`;
  over += `<text x="44" y="${H - 70}" font-family="${MONO}" font-weight="700" font-size="26" fill="${BLACK}">@tradeliketyo</text>`;
  over += `<rect x="40" y="${H-128}" width="520" height="40" fill="${BLACK}"/>`;
  over += `<text x="52" y="${H-99}" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${PAPER}">STYLE 03 — NEO-BRUTALIST</text>`;
  over += `</svg>`;
  await sharp(base).composite([{ input: photo, left: bx, top: by }, { input: await R(over) }]).png().toFile('.carousel/out/style-03-brutalist.png');
  console.log('style-03 done');
}

// ====================== STYLE 04 — SWISS / BAUHAUS GRID ======================
async function swiss() {
  const PAPER = '#F1EEE7', INK = '#111111', RED = '#E2231A', GREY = '#6E6A62';
  const bw = 420 * SCALE, bh = 540 * SCALE, bx = 596 * SCALE, by = 300 * SCALE;
  const photo = await P({ width: bw, height: bh, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .modulate({ brightness: 1.03, saturation: 1.08 }).sharpen({ sigma: 0.5 }).png().toBuffer();

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  s += `<rect width="${W}" height="${H}" fill="${PAPER}"/>`;
  // top rule + label
  s += `<line x1="64" y1="150" x2="${W - 64}" y2="150" stroke="${INK}" stroke-width="3"/>`;
  s += `<rect x="64" y="84" width="34" height="34" fill="${RED}"/>`;
  s += `<text x="112" y="112" font-family="${SANS}" font-weight="700" font-size="26" fill="${INK}">TRADELIKETYO</text>`;
  s += `<text x="${W - 64}" y="112" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="22" fill="${GREY}">14 / 07</text>`;
  // headline flush-left
  s += `<text x="60" y="320" font-family="${MONO}" font-weight="600" font-size="24" letter-spacing="2" fill="${RED}">14 ЛЕТ В ТРЕЙДИНГЕ</text>`;
  s += `<text x="58" y="430" font-family="${SANS}" font-weight="800" font-size="104" fill="${INK}">7 вещей,</text>`;
  s += `<text x="58" y="540" font-family="${SANS}" font-weight="800" font-size="84" fill="${INK}">которые</text>`;
  s += `<text x="58" y="630" font-family="${SANS}" font-weight="800" font-size="84" fill="${INK}">я усвоил</text>`;
  // big red circle geometric
  s += `<circle cx="190" cy="900" r="120" fill="${RED}"/>`;
  s += `<text x="190" y="884" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="120" fill="${PAPER}">7</text>`;
  s += `<text x="190" y="940" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="22" fill="${PAPER}">УРОКОВ</text>`;
  s += `<text x="60" y="1080" font-family="${SANS}" font-weight="600" font-size="30" fill="${GREY}">на собственном счёте.</text>`;
  s += `<text x="60" y="1118" font-family="${SANS}" font-weight="600" font-size="30" fill="${GREY}">без воды.</text>`;
  // portrait rect + thin frame
  s += `<rect x="${596 - 4}" y="${300 - 4}" width="${420 + 8}" height="${540 + 8}" fill="${INK}"/>`;
  s += `</svg>`;
  const base = await R(s);
  let over = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  over += `<text x="596" y="876" font-family="${MONO}" font-weight="600" font-size="20" fill="${GREY}">FIG. — АВТОР</text>`;
  over += `<line x1="64" y1="${H - 110}" x2="${W - 64}" y2="${H - 110}" stroke="${INK}" stroke-width="3"/>`;
  over += `<text x="64" y="${H - 66}" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${RED}">STYLE 04 — SWISS GRID</text>`;
  over += `<text x="${W - 64}" y="${H - 66}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="20" fill="${INK}">@tradeliketyo</text>`;
  over += `</svg>`;
  await sharp(base).composite([{ input: photo, left: bx, top: by }, { input: await R(over) }]).png().toFile('.carousel/out/style-04-swiss.png');
  console.log('style-04 done');
}

// ====================== STYLE 05 — FROSTED GLASS ======================
async function glass() {
  const fw = W * SCALE, fh = H * SCALE;
  // darkened full-bleed bg
  let bg = await P({ width: fw, height: fh, fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .modulate({ brightness: 0.78, saturation: 1.12 }).png().toBuffer();
  // frosted panel region
  const px = 64 * SCALE, py = 250 * SCALE, pw = (W - 128) * SCALE, ph = 600 * SCALE, rad = 36 * SCALE;
  const panelBlur = await sharp(bg).extract({ left: px, top: py, width: pw, height: ph })
    .blur(28).modulate({ brightness: 1.18 }).png().toBuffer();
  const tint = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" fill="#FFFFFF" fill-opacity="0.14"/></svg>`);
  const roundMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${rad}" ry="${rad}" fill="#fff"/></svg>`);
  const panel = await sharp(panelBlur).composite([{ input: tint }, { input: roundMask, blend: 'dest-in' }]).png().toBuffer();

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  // panel border highlight
  fg += `<rect x="64" y="250" width="${W - 128}" height="600" rx="36" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1.5"/>`;
  fg += `<text x="104" y="340" font-family="${MONO}" font-weight="600" font-size="22" letter-spacing="4" fill="#EFEAFF">14 ЛЕТ В ТРЕЙДИНГЕ</text>`;
  fg += `<text x="100" y="450" font-family="${SERIF}" font-weight="700" font-size="92" fill="#FFFFFF">7 вещей,</text>`;
  fg += `<text x="100" y="540" font-family="${SERIF}" font-weight="700" font-size="60" fill="#FFFFFF">которые я усвоил</text>`;
  fg += `<line x1="104" y1="588" x2="320" y2="588" stroke="#9FE7FF" stroke-width="2"/>`;
  fg += `<text x="104" y="640" font-family="${MONO}" font-weight="500" font-size="24" fill="#E8ECF2">на собственном счёте · без воды</text>`;
  // glass pill button
  fg += `<rect x="104" y="700" width="380" height="84" rx="42" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.5"/>`;
  fg += `<text x="294" y="752" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="26" fill="#FFFFFF">СМОТРЕТЬ 7 →</text>`;
  // top + footer
  fg += `<text x="64" y="150" font-family="${MONO}" font-weight="600" font-size="22" fill="#FFFFFF">@tradeliketyo</text>`;
  fg += `<text x="64" y="${H - 70}" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="#FFFFFF">STYLE 05 — FROSTED GLASS</text>`;
  fg += `<text x="${W - 64}" y="${H - 70}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="#FFFFFF" fill-opacity="0.7">GLASSMORPHISM</text>`;
  fg += `</svg>`;

  await sharp(bg).composite([{ input: panel, left: px, top: py }, { input: await R(fg) }]).png().toFile('.carousel/out/style-05-glass.png');
  console.log('style-05 done');
}

// ====================== STYLE 06 — TERMINAL / HUD ======================
async function terminal() {
  const GREEN = '#33FF99', AMBER = '#FFB000', DIM = '#1C6B45', BLACK = '#03060A';
  const bw = 360 * SCALE, bh = 440 * SCALE, bx = 636 * SCALE, by = 250 * SCALE;
  // green phosphor duotone portrait
  let photo = await P({ width: bw, height: bh, fit: 'cover', position: 'top', kernel: 'lanczos3' })
    .grayscale().linear(1.2, -10).tint({ r: 51, g: 255, b: 153 }).png().toBuffer();

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  s += `<rect width="${W}" height="${H}" fill="${BLACK}"/>`;
  // grid
  for (let gx = 0; gx <= W; gx += 54) s += `<line x1="${gx}" y1="0" x2="${gx}" y2="${H}" stroke="${GREEN}" stroke-opacity="0.05" stroke-width="1"/>`;
  for (let gy = 0; gy <= H; gy += 54) s += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="${GREEN}" stroke-opacity="0.05" stroke-width="1"/>`;
  s += `</svg>`;
  const base0 = await R(s);

  let fg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  fg += `<rect x="40" y="44" width="${W - 80}" height="56" fill="none" stroke="${GREEN}" stroke-opacity="0.5" stroke-width="1.5"/>`;
  fg += `<text x="58" y="82" font-family="${MONO}" font-weight="700" font-size="24" fill="${GREEN}">SYS://TRADELIKETYO</text>`;
  fg += `<text x="${W - 58}" y="82" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="24" fill="${AMBER}">[ LIVE ● ]</text>`;
  // headline mono
  fg += `<text x="48" y="220" font-family="${MONO}" font-weight="700" font-size="26" fill="${DIM}">&gt; summary(14Y) // 7 уроков</text>`;
  fg += `<text xml:space="preserve" x="46" y="320" font-family="${MONO}" font-weight="700" font-size="80" fill="${GREEN}">7 ВЕЩЕЙ,</text>`;
  fg += `<text xml:space="preserve" x="46" y="406" font-family="${MONO}" font-weight="700" font-size="80" fill="${GREEN}">КОТОРЫЕ Я</text>`;
  fg += `<text xml:space="preserve" x="46" y="492" font-family="${MONO}" font-weight="700" font-size="80" fill="${AMBER}">УСВОИЛ<tspan fill="${GREEN}">_</tspan></text>`;
  // readout table
  const rows = [['YEARS_ON_MARKET', '14'], ['LESSONS', '07'], ['RISK_PER_TRADE', '0.25%'], ['WIN_RATE', '23%'], ['AVG_R', '9:1']];
  let ry = 640;
  for (const [k, v] of rows) {
    fg += `<text x="48" y="${ry}" font-family="${MONO}" font-weight="500" font-size="28" fill="${DIM}">${k}</text>`;
    fg += `<text x="600" y="${ry}" font-family="${MONO}" font-weight="700" font-size="28" fill="${GREEN}">${v}</text>`;
    fg += `<line x1="48" y1="${ry + 14}" x2="600" y2="${ry + 14}" stroke="${GREEN}" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="2 6"/>`;
    ry += 54;
  }
  // portrait frame label
  fg += `<rect x="636" y="250" width="360" height="440" fill="none" stroke="${GREEN}" stroke-width="2" stroke-opacity="0.7"/>`;
  fg += `<text x="648" y="724" font-family="${MONO}" font-weight="600" font-size="20" fill="${GREEN}">CAM_01 // OPERATOR</text>`;
  // bottom cursor + label
  fg += `<text x="48" y="${H - 70}" font-family="${MONO}" font-weight="700" font-size="26" fill="${AMBER}">@tradeliketyo<tspan fill="${GREEN}"> ▮</tspan></text>`;
  fg += `<text x="48" y="${H - 36}" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${GREEN}">STYLE 06 — TERMINAL / HUD</text>`;
  fg += `</svg>`;

  // scanlines overlay
  let scan = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  for (let y = 0; y < H; y += 3) scan += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#000000" stroke-opacity="0.22" stroke-width="1"/>`;
  scan += `</svg>`;

  await sharp(base0).composite([
    { input: photo, left: bx, top: by },
    { input: await R(fg) },
    { input: await R(scan) },
  ]).png().toFile('.carousel/out/style-06-terminal.png');
  console.log('style-06 done');
}

(async () => { await brutalist(); await swiss(); await glass(); await terminal(); })();
