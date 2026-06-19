const sharp = require('sharp');
const fs = require('fs');

const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const emb = (x, y, h) => `<image href="${EMB}" x="${x}" y="${y}" height="${h}" width="${h * EMBR}"/>`;

const W = 1080, H = 1350, SCALE = 2;
const PHOTO_CROSS = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png'; // arms crossed
const PHOTO_SIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/e6e7d5fe-IMG_5804.jpeg';               // sitting
const MONO = 'JetBrains Mono', SANS = 'Montserrat';
const M = 56;

const INK = '#0A0E14', TEXT = '#F4F7FA', SUB = '#C3CAD4', ACC = '#7FE3FF', MUT = '#8B93A0';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
const NUM = /([+\-]?\d+(?:[.,]\d+)?\s*%?|\d+\s*:\s*\d+|t\+1|t\b)/g;
function hl(line) { const s = []; let last = 0, m; NUM.lastIndex = 0; while ((m = NUM.exec(line))) { if (m.index > last) s.push({ t: line.slice(last, m.index) }); s.push({ t: m[0], c: ACC }); last = m.index + m[0].length; } if (last < line.length) s.push({ t: line.slice(last) }); return s.length ? s : [{ t: line }]; }
const tsp = (segs, def) => segs.map(s => `<tspan fill="${s.c || def}">${esc(s.t)}</tspan>`).join('');

// ambient dark bg with soft color blobs
function bgBlobs() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <radialGradient id="c1" cx="0.2" cy="0.18" r="0.5"><stop offset="0" stop-color="#22D3EE" stop-opacity="0.42"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/></radialGradient>
    <radialGradient id="c2" cx="0.88" cy="0.3" r="0.5"><stop offset="0" stop-color="#6D5AE0" stop-opacity="0.40"/><stop offset="1" stop-color="#6D5AE0" stop-opacity="0"/></radialGradient>
    <radialGradient id="c3" cx="0.7" cy="0.92" r="0.6"><stop offset="0" stop-color="#1FB6A6" stop-opacity="0.34"/><stop offset="1" stop-color="#1FB6A6" stop-opacity="0"/></radialGradient>
    </defs><rect width="${W}" height="${H}" fill="${INK}"/>
    <rect width="${W}" height="${H}" fill="url(#c1)"/><rect width="${W}" height="${H}" fill="url(#c2)"/><rect width="${W}" height="${H}" fill="url(#c3)"/></svg>`;
}

// build a frosted panel from a base buffer (already 2x) at design-space rect
async function frost(base, x, y, w, h, rad = 34, alpha = 0.12) {
  const X = x * SCALE, Y = y * SCALE, Wd = w * SCALE, Ht = h * SCALE, Rd = rad * SCALE;
  const region = await sharp(base).extract({ left: X, top: Y, width: Wd, height: Ht }).blur(30).modulate({ brightness: 1.1 }).toBuffer();
  const tint = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}"><rect width="${Wd}" height="${Ht}" fill="#FFFFFF" fill-opacity="${alpha}"/></svg>`);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}"><rect width="${Wd}" height="${Ht}" rx="${Rd}" ry="${Rd}" fill="#fff"/></svg>`);
  const panel = await sharp(region).composite([{ input: tint }, { input: mask, blend: 'dest-in' }]).png().toBuffer();
  return { input: panel, left: X, top: Y };
}

const fgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`.replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');

function panelBorder(x, y, w, h, rad = 34) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" fill="none" stroke="#FFFFFF" stroke-opacity="0.34" stroke-width="1.5"/>`
    + `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${rad - 1}" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="1"/>`;
}
function headRow(idx, x, y, w) {
  return emb(x, y - 30, 38)
    + `<text x="${x + 66}" y="${y}" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${TEXT}">@tradeliketyo</text>`
    + `<text x="${x + w}" y="${y}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" fill="${ACC}">${idx} / 07</text>`;
}
function titleSans(lines, x, y, size, lh) { let s = '', cy = y; for (const ln of lines) { s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${SANS}" font-weight="800" font-size="${size}" fill="${TEXT}">${tsp(ln, TEXT)}</text>`; cy += lh; } return s; }
function bodySans(text, x, y, max, size = 26, lh = 40) { let s = '', cy = y; for (const ln of wrap(text, max)) { s += `<text xml:space="preserve" x="${x}" y="${cy}" font-family="${SANS}" font-weight="500" font-size="${size}" fill="${SUB}">${tsp(hl(ln), SUB)}</text>`; cy += lh; } return s; }
function kicker(t, x, y) { return `<text x="${x}" y="${y}" font-family="${MONO}" font-weight="700" font-size="19" letter-spacing="3" fill="${ACC}">${esc(t)}</text>`; }

// figures (cyan)
function equityFig(x, y, w, h) {
  const n = 60, pts = fn => { let p = []; for (let i = 0; i <= n; i++) p.push(`${(x + i / n * w).toFixed(1)},${(y + h - fn(i / n) * h).toFixed(1)}`); return p.join(' '); };
  const bt = t => 0.12 + 0.78 * Math.pow(t, 0.85) + 0.03 * Math.sin(t * 22);
  const lv = t => t < 0.45 ? 0.12 + 0.5 * t : 0.345 - 0.55 * (t - 0.45);
  let s = '';
  s += `<line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1"/>`;
  s += `<polyline points="${pts(bt)}" fill="none" stroke="${ACC}" stroke-width="3"/>`;
  s += `<polyline points="${pts(lv)}" fill="none" stroke="#FF8FA3" stroke-width="3" stroke-dasharray="2 5"/>`;
  s += `<text x="${x + w}" y="${y + h - bt(1) * h - 12}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="16" fill="${ACC}">BACKTEST</text>`;
  s += `<text x="${x + w}" y="${y + h - lv(1) * h + 24}" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="16" fill="#FF8FA3">LIVE</text>`;
  return s;
}
function lookFig(x, y, w, h) {
  const n = 40; let pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, v = 0.5 + 0.28 * Math.sin(t * 7) + 0.12 * Math.sin(t * 17) - 0.1 * t; pts.push([x + t * w, y + h - v * h]); }
  const poly = pts.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const it = 22, ix = 27; let s = `<polyline points="${poly}" fill="none" stroke="${ACC}" stroke-width="3"/>`;
  s += `<line x1="${pts[it][0]}" y1="${y}" x2="${pts[it][0]}" y2="${y + h}" stroke="#FFFFFF" stroke-opacity="0.2" stroke-dasharray="3 4"/>`;
  s += `<circle cx="${pts[it][0]}" cy="${pts[it][1]}" r="5" fill="#FFFFFF"/><text x="${pts[it][0]}" y="${y + h + 26}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="17" fill="#FFFFFF">t</text>`;
  s += `<line x1="${pts[ix][0]}" y1="${y}" x2="${pts[ix][0]}" y2="${y + h}" stroke="${ACC}" stroke-opacity="0.5" stroke-dasharray="3 4"/>`;
  s += `<circle cx="${pts[ix][0]}" cy="${pts[ix][1]}" r="6" fill="none" stroke="${ACC}" stroke-width="2.5"/><text x="${pts[ix][0]}" y="${y + h + 26}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="17" fill="${ACC}">t+1</text>`;
  s += `<text x="${(pts[it][0] + pts[ix][0]) / 2}" y="${y - 10}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="15" fill="${ACC}">видит вперёд →</text>`;
  return s;
}

const SLIDES = [];

// generic content slide on one big glass card
function card({ idx, kick, title, tsize, body, fig, foot }) {
  return async (base) => {
    const x = M, y = 120, w = W - 2 * M, h = H - 250;
    const panel = await frost(base, x, y, w, h);
    const px = x + 48;
    let fg = panelBorder(x, y, w, h) + headRow(idx, px, y + 70, w - 96);
    fg += `<line x1="${px}" y1="${y + 96}" x2="${x + w - 48}" y2="${y + 96}" stroke="#FFFFFF" stroke-opacity="0.14"/>`;
    fg += kicker(kick, px, y + 162);
    fg += titleSans(title, px, y + 232, tsize || 56, (tsize || 56) + 12);
    const by = y + 232 + ((tsize || 56) + 12) * (title.length - 1) + 86;
    if (body) fg += bodySans(body, px, by, 46);
    if (fig) fg += fig(px, y + h - 360, w - 96, 250);
    fg += `<text x="${px}" y="${y + h - 44}" font-family="${MONO}" font-weight="600" font-size="17" fill="${MUT}">${esc(foot)}</text>`;
    fg += `<text x="${x + w - 48}" y="${y + h - 44}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" fill="${ACC}">tradeliketyo</text>`;
    return sharp(base).composite([panel, { input: await R(fgWrap(fg)) }]);
  };
}

// S1 COVER — portrait bg + lower glass card
SLIDES.push(async () => {
  let base = await sharp(PHOTO_SIT).resize({ width: W * SCALE, height: H * SCALE, fit: 'cover', position: 'attention', kernel: 'lanczos3' })
    .modulate({ brightness: 0.82, saturation: 1.12 }).toBuffer();
  // ambient tint top
  base = await sharp(base).composite([{ input: await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.2" cy="0.15" r="0.6"><stop offset="0" stop-color="#22D3EE" stop-opacity="0.25"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`) }]).toBuffer();
  const x = M, y = 700, w = W - 2 * M, h = 510;
  const panel = await frost(base, x, y, w, h, 36, 0.14);
  const px = x + 48;
  let fg = emb(M, 62, 40) + `<text x="${M + 70}" y="92" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${TEXT}">@tradeliketyo</text>`;
  fg += `<text x="${W - M}" y="92" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="18" fill="${ACC}">FIG. 01</text>`;
  fg += panelBorder(x, y, w, h, 36);
  fg += kicker('РАЗБОР · BACKTESTING', px, y + 86);
  fg += titleSans([[{ t: 'Почему ' }, { t: '9 из 10', c: ACC }], [{ t: 'бэктестов врут' }]], px, y + 176, 72, 84);
  fg += bodySans('Красивые цифры в тестере не равны рабочей стратегии. Разбираю, почему — и как проверять честно.', px, y + 330, 50);
  fg += `<rect x="${px}" y="${y + h - 116}" width="300" height="72" rx="36" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.5"/>`;
  fg += `<text x="${px + 150}" y="${y + h - 70}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="22" fill="${TEXT}">СМОТРЕТЬ →</text>`;
  return sharp(base).composite([panel, { input: await R(fgWrap(fg)) }]);
});

// S2 Проблема
SLIDES.push(card({ idx: '02', kick: '01 — ПРОБЛЕМА', tsize: 54,
  title: [[{ t: 'Красивые цифры' }], [{ t: 'ничего ', c: ACC }, { t: 'не доказывают' }]],
  body: 'Красивые цифры в тестере не доказывают, что стратегия работает. Они доказывают лишь, что в прошлом, при идеальных условиях, она выглядела хорошо. В реале условия другие.',
  fig: equityFig, foot: 'IDEAL VS REAL' }));

// S3 Look-ahead
SLIDES.push(card({ idx: '03', kick: '02 — ГЛАВНАЯ ОШИБКА', tsize: 58,
  title: [[{ t: 'Look-ahead ' }, { t: 'bias', c: ACC }]],
  body: 'Скрипт при тестировании видит данные на один шаг вперёд. В реальной торговле этого не будет никогда. Результат красивый — а на счёте минус.',
  fig: lookFig, foot: 't+1 LEAK' }));

// S4 Личный кейс (portrait inside glass)
SLIDES.push(async (base) => {
  const x = M, y = 120, w = W - 2 * M, h = H - 250;
  const panel = await frost(base, x, y, w, h);
  const px = x + 48;
  // portrait framed inside
  const pbx = x + w - 48 - 320, pby = y + 250, pbw = 320, pbh = 420;
  const photo = await sharp(PHOTO_CROSS).resize({ width: pbw * SCALE, height: pbh * SCALE, fit: 'cover', position: 'top', kernel: 'lanczos3' }).modulate({ brightness: 1.02, saturation: 1.08 }).toBuffer();
  const pmask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pbw * SCALE}" height="${pbh * SCALE}"><rect width="${pbw * SCALE}" height="${pbh * SCALE}" rx="${24 * SCALE}" fill="#fff"/></svg>`);
  const photoR = await sharp(photo).composite([{ input: pmask, blend: 'dest-in' }]).png().toBuffer();
  let fg = panelBorder(x, y, w, h) + headRow('04', px, y + 70, w - 96);
  fg += `<line x1="${px}" y1="${y + 96}" x2="${x + w - 48}" y2="${y + 96}" stroke="#FFFFFF" stroke-opacity="0.14"/>`;
  fg += kicker('03 — ЛИЧНЫЙ КЕЙС', px, y + 162);
  fg += titleSans([[{ t: 'Я нашёл её' }], [{ t: 'сам', c: ACC }]], px, y + 232, 58, 70);
  fg += `<text x="${px}" y="${y + 470}" font-family="${SANS}" font-weight="800" font-size="120" fill="${ACC}">701</text>`;
  fg += `<text x="${px + 4}" y="${y + 506}" font-family="${MONO}" font-weight="600" font-size="18" fill="${MUT}">сделка · сотни часов</text>`;
  fg += bodySans('Нашёл эту ошибку в собственном бэктесте. После 701 сделки. Не остановился, переделал с нуля.', px, y + 580, 30);
  fg += `<rect x="${pbx}" y="${pby}" width="${pbw}" height="${pbh}" rx="24" fill="none" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.5"/>`;
  fg += `<text x="${pbx}" y="${pby + pbh + 30}" font-family="${MONO}" font-weight="600" font-size="16" fill="${MUT}">FIG. 04 — АВТОР</text>`;
  fg += `<text x="${px}" y="${y + h - 44}" font-family="${MONO}" font-weight="600" font-size="17" fill="${MUT}">n = 701</text>`;
  fg += `<text x="${x + w - 48}" y="${y + h - 44}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" fill="${ACC}">tradeliketyo</text>`;
  return sharp(base).composite([panel, { input: photoR, left: pbx * SCALE, top: pby * SCALE }, { input: await R(fgWrap(fg)) }]);
});

// S5 Три признака (checklist)
SLIDES.push(async (base) => {
  const x = M, y = 120, w = W - 2 * M, h = H - 250;
  const panel = await frost(base, x, y, w, h);
  const px = x + 48;
  let fg = panelBorder(x, y, w, h) + headRow('05', px, y + 70, w - 96);
  fg += `<line x1="${px}" y1="${y + 96}" x2="${x + w - 48}" y2="${y + 96}" stroke="#FFFFFF" stroke-opacity="0.14"/>`;
  fg += kicker('04 — КАК ПРОВЕРЯТЬ', px, y + 162);
  fg += titleSans([[{ t: 'Три признака' }], [{ t: 'честного ', c: ACC }, { t: 'бэктеста' }]], px, y + 232, 54, 66);
  const items = [['01', 'Скрипт не видит будущего.'], ['02', 'Настройки не менялись на всём периоде теста.'], ['03', 'Проверено на разных режимах рынка, включая кризисы.']];
  let iy = y + 470;
  for (const [n, t] of items) {
    fg += `<text x="${px}" y="${iy}" font-family="${MONO}" font-weight="700" font-size="34" fill="${ACC}">${n}</text>`;
    const ls = wrap(t, 38); let ly = iy;
    for (const l of ls) { fg += `<text x="${px + 86}" y="${ly}" font-family="${SANS}" font-weight="600" font-size="30" fill="${TEXT}">${esc(l)}</text>`; ly += 40; }
    iy += Math.max(110, ls.length * 40 + 56);
    fg += `<line x1="${px}" y1="${iy - 46}" x2="${x + w - 48}" y2="${iy - 46}" stroke="#FFFFFF" stroke-opacity="0.12"/>`;
  }
  fg += `<text x="${px}" y="${y + h - 44}" font-family="${MONO}" font-weight="600" font-size="17" fill="${MUT}">CHECKLIST</text>`;
  fg += `<text x="${x + w - 48}" y="${y + h - 44}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" fill="${ACC}">tradeliketyo</text>`;
  return sharp(base).composite([panel, { input: await R(fgWrap(fg)) }]);
});

// S6 Вывод
SLIDES.push(card({ idx: '06', kick: '05 — ВЫВОД', tsize: 60,
  title: [[{ t: 'Не гарантия.' }], [{ t: 'Но ' }, { t: 'потенциал', c: ACC }, { t: '.' }]],
  body: 'Честный бэктест не гарантирует результат на реале. Но он показывает, есть ли у идеи потенциал вообще. Без него вы торгуете на вере, а не на данных.',
  foot: 'ВЫВОД' }));

// S7 CTA
SLIDES.push(async (base) => {
  const x = M, y = 300, w = W - 2 * M, h = 760;
  const panel = await frost(base, x, y, w, h, 40, 0.14);
  const px = x + 48, cx = W / 2;
  let fg = emb(M, 120, 40) + `<text x="${M + 70}" y="150" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="2" fill="${TEXT}">@tradeliketyo</text>`;
  fg += `<text x="${W - M}" y="150" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="18" fill="${ACC}">07 / 07</text>`;
  fg += panelBorder(x, y, w, h, 40);
  fg += kicker('ЧТО ДАЛЬШЕ', cx, y + 110).replace(`x="${cx}"`, `x="${cx}" text-anchor="middle"`);
  fg += titleSans([[{ t: 'Система — на' }], [{ t: 'честной ', c: ACC }, { t: 'проверке' }]], cx, y + 220, 60, 74).replace(/x="\d+"/g, `x="${cx}"`).replace(/<text xml:space="preserve" /g, `<text xml:space="preserve" text-anchor="middle" `);
  fg += `<text x="${cx}" y="${y + 360}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="26" fill="${SUB}">Полную систему разбираю в мини-курсе.</text>`;
  fg += `<text x="${cx}" y="${y + 398}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="26" fill="${SUB}">Бесплатно. Ссылка в профиле.</text>`;
  fg += `<rect x="${cx - 250}" y="${y + 470}" width="500" height="84" rx="42" fill="#FFFFFF" fill-opacity="0.18" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="1.5"/>`;
  fg += `<text x="${cx}" y="${y + 522}" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="1" fill="${TEXT}">СМОТРЕТЬ СИСТЕМУ →</text>`;
  fg += `<text x="${cx}" y="${y + 630}" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="40" fill="${ACC}">@tradeliketyo</text>`;
  return sharp(base).composite([panel, { input: await R(fgWrap(fg)) }]);
});

(async () => {
  for (let i = 0; i < SLIDES.length; i++) {
    const base = await R(bgBlobs());
    const out = await SLIDES[i](base);
    const f = `.carousel/out/glass-${String(i + 1).padStart(2, '0')}.png`;
    await out.png({ compressionLevel: 9 }).toFile(f);
    console.log('rendered', f);
  }
})();
