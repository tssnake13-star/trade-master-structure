const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1350;
const M = 84;
const CW = W - 2 * M;
const HANDLE = '@tradeliketyo';

// palette — Engineered Editorial (vivid)
const BG = '#07080A';
const PAPER = '#F8F5EF';
const SAND = '#FFB627';
const STEEL = '#33B7F2';
const BODY = '#DCE0E5';
const MUTE = '#9AA0A8';
const HAIR = 'rgba(248,245,239,0.20)';
const GRID = 'rgba(248,245,239,0.05)';

const SERIF = 'Playfair Display';
const MONO = 'JetBrains Mono';
const PORTRAIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const emblem = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const emblemMeta = { w: 1833, h: 1151 };

function spans(segs, def) {
  return segs.map(s => `<tspan${s.weight ? ` font-weight="${s.weight}"` : ''} fill="${s.color || def}">${esc(s.t)}</tspan>`).join('');
}

// auto-wrap monospace text into lines of <= max chars (word-based)
function wrap(text, max) {
  const words = text.split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// split a line into segments, highlighting numeric/stat tokens in SAND
const NUM = /([+\-]?\d+(?:[.,]\d+)?\s*%?|\d+\s*:\s*\d+)/g;
function highlightNums(line) {
  const segs = []; let last = 0; let m;
  NUM.lastIndex = 0;
  while ((m = NUM.exec(line))) {
    if (m.index > last) segs.push({ t: line.slice(last, m.index) });
    segs.push({ t: m[0], color: SAND });
    last = m.index + m[0].length;
  }
  if (last < line.length) segs.push({ t: line.slice(last) });
  return segs.length ? segs : [{ t: line }];
}

function grid() {
  let g = `<g>`;
  for (let x = M; x <= W - M; x += 57) g += `<line x1="${x}" y1="170" x2="${x}" y2="${H - 150}" stroke="${GRID}" stroke-width="1"/>`;
  for (let y = 170; y <= H - 150; y += 57) g += `<line x1="${M}" y1="${y}" x2="${W - M}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`;
  return g + `</g>`;
}

function header(idx) {
  const eh = 44, ew = eh * emblemMeta.w / emblemMeta.h;
  return `<image href="${emblem}" x="${M}" y="58" height="${eh}" width="${ew}"/>`
    + `<text x="${M + ew + 18}" y="88" font-family="${MONO}" font-weight="700" font-size="20" letter-spacing="3" fill="${PAPER}">TRADELIKETYO</text>`
    + `<text x="${W - M}" y="88" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${MUTE}">No ${idx} / 09</text>`
    + `<line x1="${M}" y1="118" x2="${W - M}" y2="118" stroke="${HAIR}" stroke-width="1.5"/>`;
}

function footer(fig) {
  return `<line x1="${M}" y1="${H - 92}" x2="${W - M}" y2="${H - 92}" stroke="${HAIR}" stroke-width="1.5"/>`
    + `<text x="${M}" y="${H - 58}" font-family="${MONO}" font-weight="600" font-size="19" letter-spacing="1" fill="${STEEL}">${esc(HANDLE)}</text>`
    + `<text x="${W - M}" y="${H - 58}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="17" letter-spacing="2" fill="${MUTE}">${esc(fig)}</text>`;
}

const kicker = (text, y, x = M, anchor) =>
  `<text x="${x}" y="${y}" ${anchor ? `text-anchor="${anchor}" ` : ''}font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="4" fill="${SAND}">${esc(text)}</text>`;

function headline(lines, x, y, size, lh, anchor) {
  let s = '', cy = y;
  for (const line of lines) {
    s += `<text x="${x}" y="${cy}" ${anchor ? `text-anchor="${anchor}" ` : ''}font-family="${SERIF}" font-weight="700" font-size="${size}">${spans(line, PAPER)}</text>`;
    cy += lh;
  }
  return s;
}

// auto body from raw paragraph
function bodyText(text, x, y, size, lh, max, w) {
  const lines = wrap(text, max);
  let s = '', cy = y;
  for (const line of lines) {
    s += `<text x="${x}" y="${cy}" font-family="${MONO}" font-weight="500" font-size="${size}">${spans(highlightNums(line), BODY)}</text>`;
    cy += lh;
  }
  return { svg: s, endY: cy };
}

// stat strip: cells with big number + label, hairline separators
function statStrip(items, x, y, w) {
  const cw = w / items.length;
  let s = `<line x1="${x}" y1="${y - 64}" x2="${x + w}" y2="${y - 64}" stroke="${HAIR}" stroke-width="1.5"/>`;
  s += `<line x1="${x}" y1="${y + 18}" x2="${x + w}" y2="${y + 18}" stroke="${HAIR}" stroke-width="1.5"/>`;
  items.forEach((it, i) => {
    const cx = x + i * cw + 4;
    if (i > 0) s += `<line x1="${x + i * cw}" y1="${y - 64}" x2="${x + i * cw}" y2="${y + 18}" stroke="${HAIR}" stroke-width="1.5"/>`;
    s += `<text x="${cx}" y="${y - 18}" font-family="${SERIF}" font-weight="700" font-size="46" fill="${SAND}">${esc(it.big)}</text>`;
    s += `<text x="${cx + 2}" y="${y + 6}" font-family="${MONO}" font-weight="600" font-size="15" letter-spacing="1" fill="${MUTE}">${esc(it.label)}</text>`;
  });
  return s;
}

const vignette = `<defs><radialGradient id="vig" cx="0.5" cy="0.42" r="0.75">
    <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient></defs>`;

function slide(fgInner, opts = {}) {
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${vignette}<rect width="${W}" height="${H}" fill="${BG}"/>${grid()}<rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
  const fg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${fgInner}</svg>`
    .replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');
  return { bg, fg, ...opts };
}

// ---- a standard lesson slide ----
function lesson({ idx, lessonNo, title, text, fig, stats }) {
  let inner = header(idx);
  if (!stats) inner += `<text x="${W - 56}" y="${H - 150}" text-anchor="end" font-family="${SERIF}" font-weight="900" font-size="400" fill="${SAND}" fill-opacity="0.06">${esc(lessonNo)}</text>`;
  inner += kicker(`УРОК ${lessonNo} / 07`, 210);
  inner += headline(title, M, 296, title.length > 1 ? 56 : 64, 66);
  const by = title.length > 1 ? 470 : 430;
  const b = bodyText(text, M, by, 27, 42, 54);
  inner += b.svg;
  if (stats) inner += statStrip(stats, M, 1110, CW);
  inner += footer(fig);
  return slide(inner, {});
}

// ====== SLIDES ======
const S = [];

// S1 COVER (portrait hero)
S.push(slide(
  header('01') +
  kicker('14 ЛЕТ В ТРЕЙДИНГЕ', 250) +
  headline([
    [{ t: 'Вот ' }, { t: '7', color: SAND }, { t: ' вещей,' }],
    [{ t: 'которые я усвоил' }],
    [{ t: 'на собственном' }],
    [{ t: 'счёте' }],
  ], M, 360, 58, 78) +
  `<text x="${M}" y="1085" font-family="${MONO}" font-weight="600" font-size="19" letter-spacing="2" fill="${MUTE}">7 уроков · без воды · только то, что работает</text>` +
  footer('FIG. 01 — INTRO'),
  { photo: { x: 686, y: 150, w: 394, h: 1110, feather: true } }
));

// S2 — Урок 1
S.push(lesson({
  idx: '02', lessonNo: '01', fig: 'FIG. 02 — РАБОТА',
  title: [[{ t: 'Не бросайте работу' }], [{ t: 'ради ', }, { t: 'трейдинга', color: SAND }]],
  text: 'Новички думают, что достаточно открыть счёт, и рынок начнёт оплачивать их расходы. Рынок никому ничего не должен, и он об этом не предупреждает. Сначала докажите себе, что можете стабильно работать по системе. Только после этого трейдинг заслуживает право заменить вашу зарплату.',
}));

// S3 — Урок 2
S.push(lesson({
  idx: '03', lessonNo: '02', fig: 'FIG. 03 — РЫНОК',
  title: [[{ t: 'Рынку безразличны' }], [{ t: 'ваши ', }, { t: 'обстоятельства', color: SAND }]],
  text: 'Ему всё равно, что у вас кредит, аренда и дети. Он движется тогда, когда хочет, а не тогда, когда вам нужно. Когда вы это принимаете, убыток перестаёт быть катастрофой и становится частью работы. Это не смирение, это профессиональная зрелость.',
}));

// S4 — Урок 3 (risk stat)
S.push(lesson({
  idx: '04', lessonNo: '03', fig: 'FIG. 04 — RISK',
  title: [[{ t: 'Риск-менеджмент' }], [{ t: 'важнее ', }, { t: 'точки входа', color: SAND }]],
  text: 'Вы можете ошибаться в половине сделок и всё равно закрывать год в плюс. Я торгую с риском 0,25% на сделку, и именно это держит счёт живым во время просадок. Без контроля риска даже лучшая стратегия обнулит депозит. Капитал нужно защищать раньше, чем думать о прибыли.',
  stats: [{ big: '0,25%', label: 'РИСК / СДЕЛКА' }, { big: '50%', label: 'ДОПУСТИМО ОШИБОК' }, { big: '+', label: 'ГОД В ПЛЮС' }],
}));

// S5 — Урок 4 (stats)
S.push(lesson({
  idx: '05', lessonNo: '04', fig: 'FIG. 05 — STATS',
  title: [[{ t: 'Убыток — не провал,' }], [{ t: 'а ', }, { t: 'статистика', color: SAND }]],
  text: 'В мае у меня закрылось в минус 6 сделок из 10. Итог по счёту: плюс 10%. Win rate 23% за 17 месяцев при среднем соотношении 9:1, и счёт растёт. Цель не в том, чтобы каждая сделка была прибыльной, а в том, чтобы математика работала на вашей стороне на дистанции.',
  stats: [{ big: '23%', label: 'WIN RATE / 17 МЕС' }, { big: '9:1', label: 'СРЕДНИЙ R' }, { big: '+10%', label: 'МАЙ' }],
}));

// S6 — Урок 5
S.push(lesson({
  idx: '06', lessonNo: '05', fig: 'FIG. 06 — SETUP',
  title: [[{ t: 'Анализируйте за' }], [{ t: 'терминалом', color: SAND }, { t: ', не за телефоном' }]],
  text: 'Телефон убирает из решения самое важное: контекст и хладнокровие. Маленький экран не даёт видеть структуру рынка целиком, и вы заходите в сделку по ощущению, а не по системе. Системный трейдинг начинается за нормальным монитором, с полным графиком и без уведомлений.',
}));

// S7 — Урок 6
S.push(lesson({
  idx: '07', lessonNo: '06', fig: 'FIG. 07 — PATH',
  title: [[{ t: 'Деньги приходят' }], [{ t: 'последними', color: SAND }]],
  text: 'Сначала сотни часов на графиках. Потом первые убытки и желание всё бросить. Потом понимание, что система важнее эмоций. Потом дисциплина, которая держит вас в системе даже когда три месяца подряд в минус. И только после всего этого появляется стабильность, за которой следует результат.',
}));

// S8 — Урок 7
S.push(lesson({
  idx: '08', lessonNo: '07', fig: 'FIG. 08 — GRIT',
  title: [[{ t: 'Не останавливайтесь' }], [{ t: 'раньше ', }, { t: 'времени', color: SAND }]],
  text: 'Я нашёл ошибку в собственном бэктесте после сотен часов работы. Всё сделанное казалось выброшенным. Я не остановился, переделал с нуля и получил результат лучше, чем был. Самые прибыльные трейдеры за 14 лет отличались не талантом. Они просто не уходили тогда, когда становилось тяжело.',
}));

// S9 — CTA
S.push(slide(
  header('09') +
  kicker('КОНСПЕКТ 14 ЛЕТ', 230, W / 2, 'middle') +
  `<image href="${emblem}" x="${(W - 220 * emblemMeta.w / emblemMeta.h) / 2}" y="288" height="220" width="${220 * emblemMeta.w / emblemMeta.h}"/>` +
  headline([
    [{ t: 'Полную систему —' }],
    [{ t: 'в ', }, { t: 'мини-курсе', color: SAND }],
  ], W / 2, 630, 60, 74, 'middle') +
  (function () {
    const lines = wrap('Разбираю систему, по которой принимаю решения, в бесплатном мини-курсе. Ссылка в описании профиля.', 46);
    let s = '', cy = 778;
    for (const l of lines) { s += `<text x="${W / 2}" y="${cy}" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="25" fill="${BODY}">${esc(l)}</text>`; cy += 38; }
    return s;
  })() +
  `<rect x="${M}" y="930" width="${CW}" height="150" fill="none" stroke="${SAND}" stroke-width="2"/>` +
  `<text x="${W / 2}" y="995" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="22" letter-spacing="3" fill="${MUTE}">ССЫЛКА В ОПИСАНИИ ПРОФИЛЯ →</text>` +
  `<text x="${W / 2}" y="1050" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="44" fill="${SAND}">@tradeliketyo</text>` +
  footer('FIG. 09 — CTA'),
  {}
));

// ---------- render ----------
const SCALE = 2;
const DPI = 72 * SCALE;
const renderSvg = (svg) => sharp(Buffer.from(svg), { density: DPI }).resize(W * SCALE, H * SCALE).png().toBuffer();

async function makePhoto(p) {
  const pw = p.w * SCALE, ph = p.h * SCALE;
  let img = sharp(PORTRAIT).resize({ width: pw, height: ph, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .modulate({ brightness: 1.06, saturation: 1.2 }).linear(1.05, 0).sharpen({ sigma: 0.6 });
  let buf = await img.png().toBuffer();
  if (p.feather) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs>
      <linearGradient id="lx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.34" stop-color="#fff" stop-opacity="1"/></linearGradient>
      <linearGradient id="ly" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.16" stop-color="#fff" stop-opacity="1"/></linearGradient></defs>
      <rect width="${pw}" height="${ph}" fill="url(#lx)"/><rect width="${pw}" height="${ph}" fill="url(#ly)" style="mix-blend-mode:multiply"/></svg>`);
    buf = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  return buf;
}

(async () => {
  for (let i = 0; i < S.length; i++) {
    const sl = S[i];
    const base = await renderSvg(sl.bg);
    const layers = [];
    if (sl.photo) {
      const p = sl.photo;
      layers.push({ input: await makePhoto(p), left: p.x * SCALE, top: p.y * SCALE });
    }
    layers.push({ input: await renderSvg(sl.fg) });
    const file = `.carousel/out/tly-${String(i + 1).padStart(2, '0')}.png`;
    await sharp(base).composite(layers).png({ compressionLevel: 9 }).toFile(file);
    console.log('rendered', file);
  }
})();
