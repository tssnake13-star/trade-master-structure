const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350, SCALE = 2, M = 56;
const CHIN = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/6664f77e-IMG_0325.png';   // hand on chin -> cover
const HANDS = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/ea3e7b52-IMG_6639.jpeg'; // hands clasped -> CTA
const MONO = 'JetBrains Mono', GROTESK = 'Oswald';

const INK = '#06070A', LIME = '#C6F24E', CYAN = '#22D3EE', WHITE = '#F2F5EC', BODY = '#CDD2C8', MUT = '#828892', RED = '#FF5C5C';
const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
const NUM = /([+\-]?\d+(?:[.,]\d+)?\s*%?|\d+\s*:\s*\d+)/g;
function hl(line) { const s = []; let last = 0, m; NUM.lastIndex = 0; while ((m = NUM.exec(line))) { if (m.index > last) s.push({ t: line.slice(last, m.index) }); s.push({ t: m[0], c: LIME }); last = m.index + m[0].length; } if (last < line.length) s.push({ t: line.slice(last) }); return s.length ? s : [{ t: line }]; }
const tsp = (segs, def) => segs.map(s => `<tspan fill="${s.c || def}">${esc(s.t)}</tspan>`).join('');
const emb = (x, y, h) => `<image href="${EMB}" x="${x}" y="${y}" height="${h}" width="${h * EMBR}"/>`;

function bg() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${INK}"/>`;
  for (let x = 0; x <= W; x += 45) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${LIME}" stroke-opacity="0.04" stroke-width="1"/>`;
  for (let y = 0; y <= H; y += 45) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LIME}" stroke-opacity="0.04" stroke-width="1"/>`;
  return s + `</svg>`;
}
function header(idx) {
  return emb(M, 44, 60)
    + `<text x="${W - M}" y="74" text-anchor="end" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="1" fill="${LIME}">${idx} / 08</text>`
    + `<text x="${W - M}" y="100" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="16" letter-spacing="1" fill="${CYAN}">SYSTEM ● LIVE</text>`
    + `<line x1="${M}" y1="126" x2="${W - M}" y2="126" stroke="${LIME}" stroke-opacity="0.25" stroke-width="1.5"/>`;
}
function footer(tag) {
  return `<line x1="${M}" y1="${H - 92}" x2="${W - M}" y2="${H - 92}" stroke="${LIME}" stroke-opacity="0.25" stroke-width="1.5"/>`
    + `<text x="${M}" y="${H - 56}" font-family="${MONO}" font-weight="700" font-size="18" letter-spacing="1" fill="${MUT}">// TRADELIKETYO_SYSTEM</text>`
    + `<text x="${W - M}" y="${H - 56}" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="16" letter-spacing="1" fill="${MUT}">${esc(tag)}</text>`;
}
const kicker = (t, y, x = M, anc) => `<text x="${x}" y="${y}"${anc ? ` text-anchor="${anc}"` : ''} font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="3" fill="${LIME}">${esc(t)}</text>`;
function gtitle(lines, x, y, size, lh, anc) { let s = '', cy = y; for (const ln of lines) { s += `<text xml:space="preserve" x="${x}" y="${cy}"${anc ? ` text-anchor="${anc}"` : ''} font-family="${GROTESK}" font-weight="700" font-size="${size}" fill="${WHITE}">${tsp(ln, WHITE)}</text>`; cy += lh; } return s; }
function body(text, x, y, max, size = 27, lh = 44, anc) { let s = '', cy = y; for (const ln of wrap(text, max)) { s += `<text xml:space="preserve" x="${x}" y="${cy}"${anc ? ` text-anchor="${anc}"` : ''} font-family="${MONO}" font-weight="500" font-size="${size}" fill="${BODY}">${tsp(hl(ln), BODY)}</text>`; cy += lh; } return s; }

function candles(x, y, w, n = 16) {
  let r = 9; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const step = w / n; let s = `<g opacity="0.9">`; let mid = y;
  for (let i = 0; i < n; i++) { const cx = x + i * step + step / 2; mid += (rnd() - 0.5) * 22; mid = Math.max(y - 26, Math.min(y + 26, mid)); const bh = 8 + rnd() * 24, up = rnd() > 0.42, c = up ? LIME : RED, wick = bh + 8 + rnd() * 14; s += `<line x1="${cx}" y1="${mid - wick / 2}" x2="${cx}" y2="${mid + wick / 2}" stroke="${c}" stroke-width="2"/>`; s += `<rect x="${cx - step * 0.26}" y="${mid - bh / 2}" width="${step * 0.52}" height="${bh}" fill="${c}" stroke="${c}" stroke-width="2"/>`; }
  return s + `</g>`;
}
function statCells(items, x, y, w, perRow) {
  const cw = w / perRow, ch = 132, rows = Math.ceil(items.length / perRow);
  let s = '';
  items.forEach((it, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const cx = x + c * cw, cy = y + r * (ch + 16);
    s += `<rect x="${cx}" y="${cy}" width="${cw - 16}" height="${ch}" fill="${LIME}" fill-opacity="0.05" stroke="${LIME}" stroke-opacity="0.45" stroke-width="1.5"/>`;
    s += `<text x="${cx + 22}" y="${cy + 76}" font-family="${GROTESK}" font-weight="700" font-size="58" fill="${LIME}">${esc(it.big)}</text>`;
    s += `<text x="${cx + 24}" y="${cy + 108}" font-family="${MONO}" font-weight="600" font-size="15" letter-spacing="1" fill="${MUT}">${esc(it.label)}</text>`;
  });
  return s;
}

const fgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inner}</svg>`.replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');

async function feather(src, w, h, dir = 'l') {
  const pw = w * SCALE, ph = h * SCALE;
  let buf = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: 'top', kernel: 'lanczos3' }).modulate({ brightness: 1.05, saturation: 1.12 }).linear(1.06, 0).sharpen({ sigma: 0.6 }).png().toBuffer();
  const grad = dir === 'l' ? `<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.34" stop-color="#fff" stop-opacity="1"/></linearGradient>`
    : `<linearGradient id="g" x1="1" x2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.34" stop-color="#fff" stop-opacity="1"/></linearGradient>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs>${grad}</defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
  return sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
function corner(x, y, s, flipX, flipY) { const sx = flipX ? -1 : 1, sy = flipY ? -1 : 1; return `<path d="M${x} ${y + sy * s} L${x} ${y} L${x + sx * s} ${y}" fill="none" stroke="${LIME}" stroke-width="3"/>`; }

const SL = [];

// content slide factory
function slide({ idx, kick, title, tsize, lh, text, max = 50, tag, stats, perRow, statY = 980 }) {
  let inner = header(idx) + kicker(kick, 190);
  inner += gtitle(title, M, 268, tsize, lh);
  const ty = 268 + lh * (title.length - 1) + 96;
  if (text) inner += body(text, M, ty, max);
  if (stats) inner += statCells(stats, M, statY, W - 2 * M, perRow);
  else inner += candles(M, 1150, W - 2 * M - 220);
  inner += footer(tag);
  return { type: 'solid', fg: fgWrap(inner) };
}

// S1 COVER (photo)
SL.push({
  type: 'photo', src: CHIN, w: 520, h: 1350, x: 560,
  fg: fgWrap(
    header('01')
    + kicker('// РАЗБОР · МЫШЛЕНИЕ', 230)
    + gtitle([[{ t: 'ПРОБЛЕМА' }], [{ t: 'НЕ В' }], [{ t: 'СТРАТЕГИИ', c: LIME }]], M - 4, 360, 116, 112)
    + `<rect x="${M}" y="715" width="360" height="7" fill="${LIME}"/>`
    + body('Поэтому новая вас не спасёт.', M, 790, 40)
    + corner(M, 150, 30) + corner(W - 56, 150, 30, true)
    + candles(M, 1180, 460)
    + footer('FIG. 01 — HOOK')
  )
});

// S2 боль
SL.push(slide({ idx: '02', kick: '// БОЛЬ', tag: '02 — PAIN',
  title: [[{ t: 'ЗНАНИЯ ЕСТЬ.' }], [{ t: 'РЕЗУЛЬТАТА ' }, { t: 'НЕТ', c: LIME }, { t: '.' }]], tsize: 88, lh: 92,
  text: 'Понимание рынка есть, хорошие сделки тоже. А потом — сомнение, импульс, вход на эмоциях. Один такой период стирает результат трёх месяцев.' }));

// S3 настоящая проблема
SL.push(slide({ idx: '03', kick: '// КОРЕНЬ ПРОБЛЕМЫ', tag: '03 — ROOT',
  title: [[{ t: 'НЕТ МЕХАНИЗМА,' }], [{ t: 'КОТОРЫЙ ГОВОРИТ' }], [{ t: 'ДА ', c: LIME }, { t: 'ИЛИ ' }, { t: 'НЕТ', c: RED }]], tsize: 70, lh: 78,
  text: 'И которому можно доверять в тот момент, когда рука уже тянется к кнопке.' }));

// S4 принцип
SL.push(slide({ idx: '04', kick: '// ПРИНЦИП', tag: '04 — RULE',
  title: [[{ t: 'ПРОФИ ОТЛИЧАЕТ' }], [{ t: 'НЕ ' }, { t: 'АНАЛИЗ', c: LIME }]], tsize: 84, lh: 90,
  text: 'А способность остановиться, когда система говорит «нет». Любитель ищет новый сетап. Профессионал умеет пройти мимо.' }));

// S5 разрыв шаблона (stats 3)
SL.push(slide({ idx: '05', kick: '// РАЗРЫВ ШАБЛОНА', tag: '05 — MYTH',
  title: [[{ t: '70% ПРИБЫЛЬНЫХ —' }], [{ t: 'ЭТО ' }, { t: 'МИФ', c: RED }]], tsize: 86, lh: 92,
  text: 'Большинство уверено, что нужно 70% плюсовых сделок. В моей системе математика устроена иначе:',
  stats: [{ big: '23%', label: 'WIN RATE' }, { big: '10:1', label: 'СООТНОШЕНИЕ' }, { big: '~11%', label: 'ТОЧКА Б/У' }], perRow: 3, statY: 1010 }));

// S6 доказательства (stats 6)
SL.push(slide({ idx: '06', kick: '// ЦИФРЫ, НЕ ОБЕЩАНИЯ', tag: '06 — PROOF',
  title: [[{ t: 'ЖИВАЯ ' }, { t: 'СТАТИСТИКА', c: LIME }]], tsize: 78, lh: 84,
  text: '17 месяцев реальной торговли, риск 0.25% на сделку:', max: 52,
  stats: [{ big: '+85.6%', label: 'БЕЗ КОМПАУНДА' }, { big: '299', label: 'СДЕЛОК' }, { big: '17', label: 'МЕСЯЦЕВ' }, { big: '2.50', label: 'PROFIT FACTOR' }, { big: '2.23%', label: 'МАКС. ПРОСАДКА' }, { big: '0.25%', label: 'РИСК / СДЕЛКА' }], perRow: 3, statY: 640 }));

// S7 что меняется
SL.push(slide({ idx: '07', kick: '// ЧТО МЕНЯЕТСЯ', tag: '07 — SYSTEM',
  title: [[{ t: 'ВХОД РАЗРЕШАЕТ' }], [{ t: 'СИСТЕМА', c: LIME }, { t: ',' }], [{ t: 'А НЕ НАСТРОЕНИЕ' }]], tsize: 72, lh: 80,
  text: 'Совпали все шаги — заходите. Не совпал хоть один — сделки нет. Хаос уходит, когда решение принимает алгоритм.' }));

// S8 CTA (photo + handle)
SL.push({
  type: 'photo', src: HANDS, w: 470, h: 1350, x: 610, dir: 'l',
  fg: fgWrap(
    header('08')
    + kicker('// ДОСТУП ОТКРЫТ', 240)
    + gtitle([[{ t: 'ТРИ УРОКА —' }], [{ t: 'БЕСПЛАТНО', c: LIME }]], M - 2, 350, 92, 96)
    + body('Посмотрите, как работает алгоритм изнутри. Без риска и без обязательств.', M, 540, 34)
    + `<rect x="${M}" y="700" width="470" height="92" fill="none" stroke="${LIME}" stroke-width="2"/>`
    + `<text x="${M + 235}" y="757" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="1" fill="${LIME}">СМОТРЕТЬ УРОКИ →</text>`
    + `<text x="${M}" y="900" font-family="${GROTESK}" font-weight="700" font-size="58" fill="${WHITE}">@tradeliketyo</text>`
    + `<text x="${M}" y="948" font-family="${MONO}" font-weight="600" font-size="22" fill="${MUT}">ссылка в шапке профиля</text>`
    + candles(M, 1180, 460)
    + footer('08 — CTA')
  )
});

(async () => {
  for (let i = 0; i < SL.length; i++) {
    const s = SL[i];
    let out;
    if (s.type === 'photo') {
      const photo = await feather(s.src, s.w, s.h, s.dir || 'l');
      out = sharp(await R(bg())).composite([{ input: photo, left: s.x * SCALE, top: 0 }, { input: await R(s.fg) }]);
    } else {
      out = sharp(await R(bg())).composite([{ input: await R(s.fg) }]);
    }
    const f = `.carousel/out/acid-${String(i + 1).padStart(2, '0')}.png`;
    await out.png({ compressionLevel: 9 }).toFile(f);
    console.log('rendered', f);
  }
})();
