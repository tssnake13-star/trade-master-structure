const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2;
const MONO = 'JetBrains Mono', GROTESK = 'Oswald', SANS = 'Montserrat';
const BG = '#F3F0E9', INK = '#15110F', RED = '#E5231B', REDD = '#B0140D', GREEN = '#1FA85B', GREY = '#8C877E';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem-ink.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function card(x, y, w, h, rad = 18) {
  return `<rect x="${x + 3}" y="${y + 7}" width="${w}" height="${h}" rx="${rad}" fill="#000000" fill-opacity="0.10"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="#FFFFFF"/>`;
}
function miniChart(x, y, w, h, dir) {
  const col = dir === 'up' ? GREEN : RED;
  const n = 12; let pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; const v = dir === 'up' ? (0.15 + 0.7 * t + 0.08 * Math.sin(t * 9)) : (0.85 - 0.62 * t + 0.08 * Math.sin(t * 9)); pts.push([x + t * w, y + h - v * h]); }
  const poly = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return `<polyline points="${poly}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<circle cx="${last[0]}" cy="${last[1]}" r="6" fill="${col}"/>`;
}
function badge(x, y, w, label, value, col, arr) {
  return card(x, y, w, 88, 16)
    + `<circle cx="${x + 28}" cy="${y + 44}" r="9" fill="${col}"/>`
    + `<text x="${x + 52}" y="${y + 38}" font-family="${MONO}" font-weight="600" font-size="17" fill="${GREY}">${esc(label)}</text>`
    + `<text x="${x + 52}" y="${y + 70}" font-family="${GROTESK}" font-weight="700" font-size="34" fill="${INK}">${esc(value)} <tspan fill="${col}">${arr}</tspan></text>`;
}

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
s += `<rect width="${W}" height="${H}" fill="${BG}"/>`;
// faint decorations: dotted grid + tech lines + concentric circle top-right
let dots = '<g fill="#000000" fill-opacity="0.05">';
for (let yy = 60; yy < H; yy += 46) for (let xx = 40; xx < W; xx += 46) dots += `<circle cx="${xx}" cy="${yy}" r="1.6"/>`;
dots += '</g>';
s += dots;
s += `<g stroke="${RED}" stroke-opacity="0.18" fill="none" stroke-width="1.5"><circle cx="980" cy="150" r="120"/><circle cx="980" cy="150" r="78"/><path d="M760 120 H880 L910 150"/><path d="M820 220 H900"/></g>`;
s += `<g fill="${RED}" fill-opacity="0.3"><circle cx="760" cy="120" r="4"/><circle cx="900" cy="220" r="4"/></g>`;

// defs for gloss
s += `<defs><linearGradient id="redg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RED}"/><stop offset="1" stop-color="${REDD}"/></linearGradient></defs>`;

// top bar
s += `<image href="${EMB}" x="56" y="54" height="48" width="${48 * EMBR}"/>`;
s += `<text x="${W - 56}" y="92" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="2" fill="${RED}">ПОДПИШИСЬ</text>`;

// headline
s += `<text xml:space="preserve" x="56" y="270" font-family="${GROTESK}" font-weight="700" font-size="74" fill="${INK}">ВЫ ПРОВЕРЯЕТЕ ГРАФИК</text>`;
s += `<text xml:space="preserve" x="50" y="430" font-family="${GROTESK}" font-weight="700" font-size="170" fill="url(#redg)">40 РАЗ</text>`;
s += `<text xml:space="preserve" x="56" y="528" font-family="${GROTESK}" font-weight="700" font-size="86" fill="${INK}">В ДЕНЬ</text>`;
// red glossy sub-banner
s += card(56, 566, W - 112, 92, 20).replace(/#FFFFFF/, 'url(#redg)');
s += `<text x="84" y="624" font-family="${SANS}" font-weight="700" font-size="28" fill="#FFFFFF">И прибыльнее от этого не становитесь.</text>`;

// before/after section
const colW = 430, lx = 56, rx = W - 56 - colW, ty = 720;
s += `<text x="${lx}" y="${ty}" font-family="${GROTESK}" font-weight="700" font-size="40" fill="${RED}">ХАОС</text>`;
s += `<text x="${rx}" y="${ty}" font-family="${GROTESK}" font-weight="700" font-size="40" fill="${GREEN}">СИСТЕМА</text>`;
// arrow center
s += `<text x="${W / 2}" y="${ty + 250}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="60" fill="${RED}">›</text>`;
// chart cards
s += card(lx, ty + 24, colW, 210, 20) + miniChart(lx + 28, ty + 60, colW - 56, 130, 'down');
s += `<text x="${lx + 28}" y="${ty + 218}" font-family="${MONO}" font-weight="600" font-size="17" fill="${GREY}">тревога · импульс · слитые сделки</text>`;
s += card(rx, ty + 24, colW, 210, 20) + miniChart(rx + 28, ty + 60, colW - 56, 130, 'up');
s += `<text x="${rx + 28}" y="${ty + 218}" font-family="${MONO}" font-weight="600" font-size="17" fill="${GREY}">спокойствие · контроль · рост</text>`;
// badges
s += badge(lx, ty + 264, colW, 'ПРОВЕРОК В ДЕНЬ', '40', RED, '↑');
s += badge(rx, ty + 264, colW, 'РЕШЕНИЕ В ДЕНЬ', '1', GREEN, '↓');

// bottom: pill + counter
s += card(56, H - 150, 210, 76, 38).replace(/#FFFFFF/, 'url(#redg)');
s += `<text x="161" y="${H - 102}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="26" fill="#FFFFFF">листай →</text>`;
s += `<text x="${W - 56}" y="${H - 100}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="1" fill="${GREY}">01 — 08</text>`;

s += `</svg>`;

(async () => { await sharp(await R(s)).png().toFile('.carousel/out/gloss-cover-test.png'); console.log('gloss cover done'); })();
