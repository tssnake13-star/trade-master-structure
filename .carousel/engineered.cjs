const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350;
const M = 84;                 // outer margin
const CW = W - 2 * M;         // content width 912
const HANDLE = '@tradeliketyo';

// palette — Engineered Editorial (vivid)
const BG = '#07080A';
const PAPER = '#F8F5EF';      // bright warm off-white
const SAND = '#FFB627';       // juicy warm gold accent
const STEEL = '#33B7F2';      // juicy steel-blue accent
const BODY = '#DCE0E5';       // body text
const MUTE = '#9AA0A8';       // muted mono
const HAIR = 'rgba(248,245,239,0.20)';
const GRID = 'rgba(248,245,239,0.05)';

const SERIF = 'Playfair Display';
const MONO = 'JetBrains Mono';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// base64 assets
const emblemB64 = fs.readFileSync('.carousel/assets/emblem.png').toString('base64');
const emblem = `data:image/png;base64,${emblemB64}`;
const emblemMeta = { w: 1833, h: 1151 }; // from prep output

function spans(segs, def) {
  return segs.map(s => `<tspan${s.weight ? ` font-weight="${s.weight}"` : ''} fill="${s.color || def}">${esc(s.t)}</tspan>`).join('');
}

// faint graph-paper grid
function grid() {
  let g = `<g>`;
  for (let x = M; x <= W - M; x += 57) g += `<line x1="${x}" y1="170" x2="${x}" y2="${H - 150}" stroke="${GRID}" stroke-width="1"/>`;
  for (let y = 170; y <= H - 150; y += 57) g += `<line x1="${M}" y1="${y}" x2="${W - M}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`;
  g += `</g>`;
  return g;
}

function header(idx) {
  const eh = 44, ew = eh * emblemMeta.w / emblemMeta.h;
  let s = '';
  s += `<image href="${emblem}" x="${M}" y="58" height="${eh}" width="${ew}"/>`;
  s += `<text x="${M + ew + 18}" y="88" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="3" fill="${PAPER}">TRADELIKETYO</text>`;
  s += `<text x="${W - M}" y="88" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${MUTE}">No ${idx} / 07</text>`;
  s += `<line x1="${M}" y1="118" x2="${W - M}" y2="118" stroke="${HAIR}" stroke-width="1.5"/>`;
  return s;
}

function footer(fig) {
  let s = '';
  s += `<line x1="${M}" y1="${H - 92}" x2="${W - M}" y2="${H - 92}" stroke="${HAIR}" stroke-width="1.5"/>`;
  s += `<text x="${M}" y="${H - 58}" font-family="${MONO}" font-weight="600" font-size="19" letter-spacing="1" fill="${STEEL}">${esc(HANDLE)}</text>`;
  s += `<text x="${W - M}" y="${H - 58}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="17" letter-spacing="2" fill="${MUTE}">${esc(fig)}</text>`;
  return s;
}

function kicker(text, y) {
  return `<text x="${M}" y="${y}" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="4" fill="${SAND}">${esc(text)}</text>`;
}

// serif headline lines: array of arrays of segments
function headline(lines, x, y, size, lh, anchor) {
  let s = '', cy = y;
  for (const line of lines) {
    s += `<text x="${x}" y="${cy}" ${anchor ? `text-anchor="${anchor}" ` : ''}font-family="${SERIF}" font-weight="700" font-size="${size}">${spans(line, PAPER)}</text>`;
    cy += lh;
  }
  return s;
}

// mono body: array of lines (each = array of segments)
function body(lines, x, y, size, lh) {
  let s = '', cy = y;
  for (const line of lines) {
    s += `<text x="${x}" y="${cy}" font-family="${MONO}" font-weight="500" font-size="${size}">${spans(line, BODY)}</text>`;
    cy += lh;
  }
  return s;
}

// equity divergence figure (backtest vs live)
function equityFig(x, y, w, h) {
  const n = 60;
  const pts = (fn) => {
    let p = [];
    for (let i = 0; i <= n; i++) { p.push([x + (i / n) * w, y + h - fn(i / n) * h]); }
    return p.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  };
  const bt = t => 0.12 + 0.78 * Math.pow(t, 0.85) + 0.03 * Math.sin(t * 22); // smooth rising
  const live = t => t < 0.45 ? 0.12 + 0.5 * t + 0.02 * Math.sin(t * 20)
    : (0.12 + 0.5 * 0.45) - 0.55 * (t - 0.45) + 0.02 * Math.sin(t * 26);     // rises then falls
  let s = `<g>`;
  // frame
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${HAIR}" stroke-width="1.5"/>`;
  // axis ticks
  for (let i = 0; i <= 4; i++) { const xx = x + (i / 4) * w; s += `<line x1="${xx}" y1="${y + h}" x2="${xx}" y2="${y + h + 7}" stroke="${MUTE}" stroke-width="1"/>`; }
  // baseline
  s += `<line x1="${x}" y1="${y + h - 0.12 * h}" x2="${x + w}" y2="${y + h - 0.12 * h}" stroke="rgba(236,233,227,0.12)" stroke-width="1" stroke-dasharray="4 5"/>`;
  s += `<polyline points="${pts(bt)}" fill="none" stroke="${SAND}" stroke-width="2.5"/>`;
  s += `<polyline points="${pts(live)}" fill="none" stroke="${STEEL}" stroke-width="2.5" stroke-dasharray="2 4"/>`;
  // labels
  s += `<text x="${x + w - 6}" y="${y + h - bt(1) * h - 12}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" fill="${SAND}">BACKTEST</text>`;
  s += `<text x="${x + w - 6}" y="${y + h - live(1) * h + 26}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="17" fill="${STEEL}">LIVE</text>`;
  s += `</g>`;
  return s;
}

// 9 / 10 tick row
function tickRow(x, y, w) {
  const n = 10, gap = w / n, bw = gap * 0.5, hT = 92;
  let s = `<g>`;
  for (let i = 0; i < n; i++) {
    const xx = x + i * gap + (gap - bw) / 2;
    const lie = i < 9;
    s += `<rect x="${xx}" y="${y}" width="${bw}" height="${hT}" fill="${lie ? SAND : 'none'}" stroke="${lie ? 'none' : STEEL}" stroke-width="2"/>`;
  }
  s += `<text x="${x}" y="${y + hT + 30}" font-family="${MONO}" font-weight="600" font-size="18" letter-spacing="1" fill="${MUTE}">врут: 9 / 10</text>`;
  s += `<text x="${x + w}" y="${y + hT + 30}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="18" letter-spacing="1" fill="${STEEL}">честный: 1</text>`;
  s += `</g>`;
  return s;
}

// look-ahead figure: price line with peek at t+1
function lookaheadFig(x, y, w, h) {
  const n = 40;
  let pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = 0.5 + 0.28 * Math.sin(t * 7) + 0.12 * Math.sin(t * 17) - 0.1 * t;
    pts.push([x + t * w, y + h - v * h]);
  }
  const poly = pts.map(q => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const it = 22, inext = 27;
  let s = `<g>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${HAIR}" stroke-width="1.5"/>`;
  s += `<polyline points="${poly}" fill="none" stroke="${STEEL}" stroke-width="2.5"/>`;
  // t marker
  s += `<line x1="${pts[it][0]}" y1="${y}" x2="${pts[it][0]}" y2="${y + h}" stroke="rgba(236,233,227,0.18)" stroke-width="1" stroke-dasharray="3 4"/>`;
  s += `<circle cx="${pts[it][0]}" cy="${pts[it][1]}" r="5" fill="${PAPER}"/>`;
  s += `<text x="${pts[it][0]}" y="${y + h + 26}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="18" fill="${PAPER}">t</text>`;
  // t+1 peek marker
  s += `<line x1="${pts[inext][0]}" y1="${y}" x2="${pts[inext][0]}" y2="${y + h}" stroke="rgba(203,177,140,0.4)" stroke-width="1" stroke-dasharray="3 4"/>`;
  s += `<circle cx="${pts[inext][0]}" cy="${pts[inext][1]}" r="6" fill="none" stroke="${SAND}" stroke-width="2.5"/>`;
  s += `<text x="${pts[inext][0]}" y="${y + h + 26}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="18" fill="${SAND}">t+1</text>`;
  // arrow from t to t+1
  s += `<path d="M${pts[it][0] + 8} ${y + 22} L${pts[inext][0] - 8} ${y + 22}" stroke="${SAND}" stroke-width="1.5" marker-end="url(#arr)"/>`;
  s += `<text x="${(pts[it][0] + pts[inext][0]) / 2}" y="${y + 14}" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="15" fill="${SAND}">видит вперёд</text>`;
  s += `</g>`;
  return s;
}

const arrowDef = `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="${SAND}"/></marker></defs>`;

// ---------- assemble a slide ----------
const vignette = `<defs><radialGradient id="vig" cx="0.5" cy="0.42" r="0.75">
    <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient></defs>`;

function slide(fgInner, opts = {}) {
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${vignette}<rect width="${W}" height="${H}" fill="${BG}"/>${grid()}<rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
  const fg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${arrowDef}${fgInner}</svg>`
    .replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');
  return { bg, fg, ...opts };
}

// ====== SLIDES ======
const SLIDES = [];

// S1 COVER
SLIDES.push(slide(
  header('01') +
  kicker('РАЗБОР · BACKTESTING', 230) +
  headline([
    [{ t: 'Почему ' }, { t: '9 из 10', color: SAND }],
    [{ t: 'бэктестов' }],
    [{ t: 'врут' }],
  ], M, 340, 104, 112) +
  equityFig(M, 720, CW, 230) +
  tickRow(M, 1010, 520) +
  footer('FIG. 01 — ДОСТОВЕРНОСТЬ') ,
  { figlabel: 'FIG. 01' }
));

// S2 ПРОБЛЕМА
SLIDES.push(slide(
  header('02') +
  kicker('01 — ПРОБЛЕМА', 215) +
  headline([
    [{ t: 'Красивые цифры' }],
    [{ t: 'ничего ', color: SAND }, { t: 'не доказывают' }],
  ], M, 300, 72, 84) +
  body([
    [{ t: 'Красивые цифры в тестере не доказывают,' }],
    [{ t: 'что стратегия работает. Они доказывают' }],
    [{ t: 'лишь, что ' }, { t: 'в прошлом, при идеальных', color: SAND }],
    [{ t: 'условиях', color: SAND }, { t: ', она выглядела хорошо.' }],
    [{ t: 'В реале условия ' }, { t: 'другие', color: STEEL }, { t: '.' }],
  ], M, 500, 28, 46) +
  equityFig(M, 760, CW, 240) +
  `<text xml:space="preserve" x="${M}" y="1040" font-family="${MONO}" font-weight="500" font-size="18" fill="${MUTE}">идеальная кривая ≠ результат на счёте</text>` +
  footer('FIG. 02 — IDEAL VS REAL'),
  { figlabel: 'FIG. 02' }
));

// S3 LOOK-AHEAD BIAS
SLIDES.push(slide(
  header('03') +
  kicker('02 — ГЛАВНАЯ ОШИБКА', 215) +
  headline([
    [{ t: 'Look-ahead' }],
    [{ t: 'bias', color: SAND }],
  ], M, 300, 84, 96) +
  body([
    [{ t: 'Скрипт при тестировании видит данные' }],
    [{ t: 'на ' }, { t: 'один шаг вперёд', color: SAND }, { t: '. В реальной' }],
    [{ t: 'торговле этого не будет никогда.' }],
    [{ t: 'Результат красивый — а ' }, { t: 'на счёте минус', color: STEEL }, { t: '.' }],
  ], M, 520, 28, 46) +
  lookaheadFig(M, 720, CW, 250) +
  footer('FIG. 03 — t+1 LEAK'),
  { figlabel: 'FIG. 03' }
));

// S4 ЛИЧНЫЙ КЕЙС (photo)
const PHOTO_BOX = { x: W - M - 360, y: 470, w: 360, h: 470 };
SLIDES.push(slide(
  header('04') +
  kicker('03 — ЛИЧНЫЙ КЕЙС', 215) +
  headline([
    [{ t: 'Я нашёл её' }],
    [{ t: 'сам', color: SAND }],
  ], M, 300, 84, 96) +
  // big stat
  `<text xml:space="preserve" x="${M}" y="560" font-family="${SERIF}" font-weight="900" font-size="150" fill="${SAND}">701</text>` +
  `<text xml:space="preserve" x="${M + 6}" y="600" font-family="${MONO}" font-weight="600" font-size="22" letter-spacing="2" fill="${MUTE}">сделка · сотни часов ручной работы</text>` +
  body([
    [{ t: 'Нашёл эту ошибку в собственном' }],
    [{ t: 'бэктесте. После 701 сделки и сотен' }],
    [{ t: 'часов работы. ' }, { t: 'Сам', color: SAND }, { t: '. Потому что' }],
    [{ t: 'перепроверял, пока не нашёл.' }],
  ], M, 700, 27, 44) +
  // photo frame stroke + caption (photo composited under)
  `<rect x="${PHOTO_BOX.x}" y="${PHOTO_BOX.y}" width="${PHOTO_BOX.w}" height="${PHOTO_BOX.h}" fill="none" stroke="${SAND}" stroke-width="2" stroke-opacity="0.9"/>` +
  `<line x1="${PHOTO_BOX.x}" y1="${PHOTO_BOX.y - 12}" x2="${PHOTO_BOX.x + 120}" y2="${PHOTO_BOX.y - 12}" stroke="${SAND}" stroke-width="2"/>` +
  `<text xml:space="preserve" x="${PHOTO_BOX.x}" y="${PHOTO_BOX.y + PHOTO_BOX.h + 26}" font-family="${MONO}" font-weight="600" font-size="17" letter-spacing="1" fill="${MUTE}">FIG. 04 — АВТОР</text>` +
  footer('FIG. 04 — n = 701'),
  { figlabel: 'FIG. 04', photo: PHOTO_BOX }
));

// S5 КАК ПРОВЕРЯТЬ
function checkItem(num, lines, y) {
  let s = '';
  s += `<text xml:space="preserve" x="${M}" y="${y}" font-family="${MONO}" font-weight="700" font-size="30" fill="${STEEL}">${num}</text>`;
  let cy = y;
  for (const ln of lines) {
    s += `<text xml:space="preserve" x="${M + 88}" y="${cy}" font-family="${SERIF}" font-weight="600" font-size="34" fill="${PAPER}">${spans(ln, PAPER)}</text>`;
    cy += 44;
  }
  s += `<line x1="${M}" y1="${y + (lines.length) * 44 + 24}" x2="${W - M}" y2="${y + (lines.length) * 44 + 24}" stroke="${HAIR}" stroke-width="1.5"/>`;
  return s;
}
SLIDES.push(slide(
  header('05') +
  kicker('04 — КАК ПРОВЕРЯТЬ', 215) +
  headline([
    [{ t: 'Три признака' }],
    [{ t: 'честного', color: SAND }, { t: ' бэктеста' }],
  ], M, 300, 70, 82) +
  checkItem('01', [[{ t: 'Скрипт ' }, { t: 'не видит будущего', color: SAND }, { t: '.' }]], 560) +
  checkItem('02', [[{ t: 'Настройки не менялись' }], [{ t: 'на всём периоде теста.' }]], 690) +
  checkItem('03', [[{ t: 'Проверено на разных режимах' }], [{ t: 'рынка — ' }, { t: 'включая кризисы', color: STEEL }, { t: '.' }]], 868) +
  footer('FIG. 05 — CHECKLIST'),
  { figlabel: 'FIG. 05' }
));

// S6 ВЫВОД
SLIDES.push(slide(
  header('06') +
  kicker('05 — ВЫВОД', 215) +
  headline([
    [{ t: 'Не гарантия.' }],
    [{ t: 'Но ', }, { t: 'потенциал', color: SAND }, { t: '.' }],
  ], M, 320, 80, 94) +
  // pull quote frame
  `<rect x="${M}" y="560" width="${CW}" height="300" fill="none" stroke="${HAIR}" stroke-width="1.5"/>` +
  `<line x1="${M}" y1="560" x2="${M}" y2="860" stroke="${SAND}" stroke-width="4"/>` +
  body([
    [{ t: 'Честный бэктест не гарантирует' }],
    [{ t: 'результат на реале. Но показывает,' }],
    [{ t: 'есть ли у идеи потенциал вообще.' }],
    [],
    [{ t: 'Без него вы торгуете ' }, { t: 'на вере,', color: SAND }],
    [{ t: 'а не на данных', color: SAND }, { t: '.' }],
  ], M + 36, 615, 29, 44) +
  footer('FIG. 06 — ВЫВОД'),
  { figlabel: 'FIG. 06' }
));

// S7 CTA
const embH = 220, embW = embH * emblemMeta.w / emblemMeta.h;
SLIDES.push(slide(
  header('07') +
  kicker('06 — ЧТО ДАЛЬШЕ', 230) +
  `<image href="${emblem}" x="${(W - embW) / 2}" y="300" height="${embH}" width="${embW}"/>` +
  headline([
    [{ t: 'Система на честной' }],
    [{ t: 'проверке — ', }, { t: 'в боте', color: SAND }],
  ], W / 2, 640, 60, 74, 'middle') +
  `<text x="${W / 2}" y="760" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="26" fill="${BODY}">Показываю, как выглядит стратегия,</text>` +
  `<text x="${W / 2}" y="800" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="26" fill="${BODY}">построенная на честной проверке.</text>` +
  // CTA bar
  `<rect x="${M}" y="900" width="${CW}" height="150" fill="none" stroke="${SAND}" stroke-width="2"/>` +
  `<text xml:space="preserve" x="${W / 2}" y="965" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="3" fill="${MUTE}">ССЫЛКА В ПРОФИЛЕ →</text>` +
  `<text xml:space="preserve" x="${W / 2}" y="1020" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="44" fill="${SAND}">@tradeliketyo</text>` +
  footer('FIG. 07 — CTA'),
  { figlabel: 'FIG. 07' }
));

// ---------- render ----------
(async () => {
  for (let i = 0; i < SLIDES.length; i++) {
    const sl = SLIDES[i];
    const base = await sharp(Buffer.from(sl.bg)).png().toBuffer();
    const layers = [];
    if (sl.photo) {
      const p = sl.photo;
      const plate = await sharp({ create: { width: p.w, height: p.h, channels: 3, background: '#161B20' } }).png().toBuffer();
      layers.push({ input: plate, left: p.x, top: p.y });
      const photo = await sharp('.carousel/assets/portrait.png')
        .resize({ width: p.w, height: p.h, fit: 'cover', position: 'top' })
        .toBuffer();
      layers.push({ input: photo, left: p.x, top: p.y });
    }
    layers.push({ input: Buffer.from(sl.fg) });
    const file = `.carousel/out/eng-${String(i + 1).padStart(2, '0')}.png`;
    await sharp(base).composite(layers).png().toFile(file);
    console.log('rendered', file);
  }
})();
