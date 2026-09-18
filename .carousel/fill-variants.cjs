const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2, CARD = 28;
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display', GROTESK = 'Oswald', SANS = 'Montserrat';
const OUT = '#141414', WHITE = '#F4F2EC', GREY = '#B4B1A9', MUT = '#86837C';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();
const X = 40, Y = 40, CW = W - 80, CH = H - 80;

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
function body(text, x, y, max, lh, size = 27) { let s = '', cy = y; for (const ln of wrap(text, max)) { s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${SANS}" font-weight="500" font-size="${size}" fill="${GREY}">${esc(ln)}</text>`; cy += lh; } return s; }
function headline(lines, x, y) {
  let s = '', cy = y;
  for (let i = 0; i < lines.length; i++) { const ln = lines[i], fam = ln.f === 's' ? SERIF : GROTESK, it = ln.f === 's' ? ' font-style="italic"' : '';
    s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${fam}" font-weight="700"${it} font-size="${ln.size}" fill="${WHITE}">${esc(ln.t)}</text>`;
    const n = lines[i + 1]; cy += n ? (ln.size * 0.32 + n.size * 0.82) : ln.size * 0.34; }
  return { svg: s, endY: cy };
}
const topbar = () => `<text x="${X + 40}" y="${Y + 56}" font-family="${SANS}" font-weight="600" font-size="22" letter-spacing="1" fill="${GREY}">сохраняй <tspan fill="${MUT}">&amp;</tspan> подписывайся</text><image href="${EMB}" x="${X + CW - 40 - 50 * EMBR}" y="${Y + 24}" height="50" width="${50 * EMBR}"/>`;
const pill = (label = 'листай →') => { const w = 24 + label.length * 15; return `<rect x="${X + 38}" y="${Y + CH - 108}" width="${w}" height="66" rx="33" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.6"/><text x="${X + 38 + w / 2}" y="${Y + CH - 65}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="25" fill="${WHITE}">${esc(label)}</text>`; };
const counter = (idx) => `<text x="${X + CW - 40}" y="${Y + CH - 60}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="1" fill="${MUT}">${idx} — 08</text>`;
const cardBorder = () => `<rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>`;
const fgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`.replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');

const HL = [{ t: 'ДЕЛО НЕ', f: 'g', size: 100 }, { t: 'в знаниях', f: 's', size: 96 }];
const SUB = 'Вы знаете правила. Вы нарушаете их ровно тогда, когда эмоция кричит громче логики.';

const grad = `<defs><radialGradient id="d" cx="0.35" cy="0.22" r="0.9"><stop offset="0" stop-color="#272727"/><stop offset="1" stop-color="#151515"/></radialGradient><clipPath id="cc"><rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}"/></clipPath></defs>`;
const cardFill = `<rect x="${X}" y="${Y}" width="${CW}" height="${CH}" rx="${CARD}" fill="url(#d)"/>`;
const label = (t) => `<text x="${W / 2}" y="26" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="2" fill="#7a7a7a">${esc(t)}</text>`;

function variantA() { // folio + progress
  let g = `<g clip-path="url(#cc)"><text x="${X + CW - 30}" y="${Y + CH - 40}" text-anchor="end" font-family="${GROTESK}" font-weight="700" font-size="560" fill="#FFFFFF" fill-opacity="0.05">03</text></g>`;
  // progress
  const py = Y + CH - 150, seg = (CW - 80) / 8, gap = 12;
  for (let i = 0; i < 8; i++) { const xx = X + 40 + i * seg; g += `<rect x="${xx}" y="${py}" width="${seg - gap}" height="6" rx="3" fill="#FFFFFF" fill-opacity="${i === 2 ? 0.95 : 0.18}"/>`; }
  const hb = headline(HL, X + 40, Y + 320);
  return grad + cardFill + g + cardBorder() + topbar() + hb.svg + body(SUB, X + 40, hb.endY + 36, 50, 38) + pill() + counter('03') + label('A · ФОЛИО + ПРОГРЕСС');
}
function variantB() { // thematic equity/drawdown graph
  const gx = X + 40, gw = CW - 80, gy = Y + 720, gh = 300;
  const f = t => t < 0.5 ? 0.2 + 0.62 * t : (t < 0.62 ? 0.51 - 2.6 * (t - 0.5) : 0.198 + 0.02 * Math.sin(t * 20));
  let pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([gx + t * gw, gy + gh - f(t) * gh]); }
  const poly = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${gx},${gy + gh} ` + poly + ` ${gx + gw},${gy + gh}`;
  let g = `<g clip-path="url(#cc)" opacity="0.9">`;
  g += `<polygon points="${area}" fill="#FFFFFF" fill-opacity="0.03"/>`;
  g += `<polyline points="${poly}" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="2.5"/>`;
  g += `<line x1="${gx}" y1="${gy + gh - 0.2 * gh}" x2="${gx + gw}" y2="${gy + gh - 0.2 * gh}" stroke="#FFFFFF" stroke-opacity="0.12" stroke-dasharray="4 6"/>`;
  g += `<text x="${gx + gw}" y="${gy + gh - 0.2 * gh - 12}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="16" fill="${GREY}">лимит потерь</text>`;
  g += `<text x="${gx}" y="${gy - 14}" font-family="${MONO}" font-weight="600" font-size="16" fill="${GREY}">просадка под контролем</text></g>`;
  const hb = headline(HL, X + 40, Y + 320);
  return grad + cardFill + g + cardBorder() + topbar() + hb.svg + body(SUB, X + 40, hb.endY + 36, 50, 38) + pill() + counter('03') + label('B · ТЕМАТИЧЕСКИЙ ГРАФИК');
}
function variantC() { // outline echo of keyword
  let g = `<g clip-path="url(#cc)"><text x="${X + 20}" y="${Y + CH + 40}" font-family="${GROTESK}" font-weight="700" font-size="300" fill="none" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="2">ЗНАНИЯ</text></g>`;
  const hb = headline(HL, X + 40, Y + 320);
  return grad + cardFill + g + cardBorder() + topbar() + hb.svg + body(SUB, X + 40, hb.endY + 36, 50, 38) + pill() + counter('03') + label('C · КОНТУРНОЕ ЭХО СЛОВА');
}
function variantD() { // recompose: bigger + vertically centered
  const HLD = [{ t: 'ДЕЛО НЕ', f: 'g', size: 132 }, { t: 'в знаниях', f: 's', size: 124 }];
  const hb = headline(HLD, X + 40, Y + 470);
  return grad + cardFill + cardBorder() + topbar() + hb.svg + body(SUB, X + 40, hb.endY + 48, 44, 46, 31) + pill() + counter('03') + label('D · ПЕРЕКОМПОНОВКА');
}

(async () => {
  const base = await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${OUT}"/></svg>`);
  const variants = { 'A': variantA, 'B': variantB, 'C': variantC, 'D': variantD };
  for (const [k, fn] of Object.entries(variants)) {
    await sharp(base).composite([{ input: await R(fgWrap(fn())) }]).png().toFile(`.carousel/out/fill-variant-${k}.png`);
    console.log('rendered', k);
  }
})();
