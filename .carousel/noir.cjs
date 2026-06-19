const sharp = require('sharp');
const fs = require('fs');

const EMB = `data:image/png;base64,${fs.readFileSync('.carousel/assets/emblem.png').toString('base64')}`;
const EMBR = 1833 / 1151;
const emb = (x, y, h) => `<image href="${EMB}" x="${x}" y="${y}" height="${h}" width="${h * EMBR}"/>`;

const W = 1080, H = 1350, SCALE = 2;
const PORTRAIT = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/a3fc77de-B1B0D309C2E641159D38EA86E3D95AF9.png';
const SITTING = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/e6e7d5fe-IMG_5804.jpeg';
const MONO = 'JetBrains Mono', SERIF = 'Playfair Display';
const M = 84;

// warm noir palette
const BG = '#0B0806', PAPER = '#F4ECDE', GOLD = '#E8C77E', BODY = '#C7BEAF', MUTE = '#897F70';
const HAIR = 'rgba(244,236,222,0.16)';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const R = (svg) => sharp(Buffer.from(svg), { density: 72 * SCALE }).resize(W * SCALE, H * SCALE).png().toBuffer();

function wrap(t, max) { const w = t.split(/\s+/); const L = []; let c = ''; for (const x of w) { if (!c) c = x; else if ((c + ' ' + x).length <= max) c += ' ' + x; else { L.push(c); c = x; } } if (c) L.push(c); return L; }
const NUM = /([+\-]?\d+(?:[.,]\d+)?\s*%?|\d+\s*:\s*\d+)/g;
function hl(line) { const s = []; let last = 0, m; NUM.lastIndex = 0; while ((m = NUM.exec(line))) { if (m.index > last) s.push({ t: line.slice(last, m.index) }); s.push({ t: m[0], c: GOLD }); last = m.index + m[0].length; } if (last < line.length) s.push({ t: line.slice(last) }); return s.length ? s : [{ t: line }]; }
const tsp = (segs, def) => segs.map(s => `<tspan fill="${s.c || def}"${s.it ? ' font-style="italic"' : ''}>${esc(s.t)}</tspan>`).join('');

function head(idx) {
  return emb(M, 50, 40)
    + `<text x="${M + 72}" y="84" font-family="${MONO}" font-weight="600" font-size="19" letter-spacing="3" fill="${PAPER}" fill-opacity="0.85">@tradeliketyo</text>`
    + `<text x="${W - M}" y="84" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="17" letter-spacing="2" fill="${GOLD}">${idx} / 09</text>`
    + `<line x1="${M}" y1="106" x2="${W - M}" y2="106" stroke="${HAIR}" stroke-width="1"/>`;
}
function foot(fig) {
  return `<line x1="${M}" y1="${H - 92}" x2="${W - M}" y2="${H - 92}" stroke="${HAIR}" stroke-width="1"/>`
    + `<text x="${M}" y="${H - 56}" font-family="${MONO}" font-weight="600" font-size="18" letter-spacing="1" fill="${GOLD}">@tradeliketyo</text>`
    + `<text x="${W - M}" y="${H - 56}" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="16" letter-spacing="2" fill="${MUTE}">${esc(fig)}</text>`;
}
function titleBlock(lines, y, size, lh) {
  let s = '', cy = y; for (const ln of lines) { s += `<text xml:space="preserve" x="${M}" y="${cy}" font-family="${SERIF}" font-weight="700" font-size="${size}">${tsp(ln, PAPER)}</text>`; cy += lh; } return s;
}
function bodyBlock(text, y, max = 54, size = 27, lh = 46) {
  let s = '', cy = y; for (const ln of wrap(text, max)) { s += `<text xml:space="preserve" x="${M}" y="${cy}" font-family="${MONO}" font-weight="500" font-size="${size}">${tsp(hl(ln), BODY)}</text>`; cy += lh; } return s;
}
function statLine(items, y) {
  const w = W - 2 * M, cw = w / items.length;
  let s = `<line x1="${M}" y1="${y - 56}" x2="${W - M}" y2="${y - 56}" stroke="${HAIR}" stroke-width="1"/>`;
  items.forEach((it, i) => {
    const cx = M + i * cw;
    if (i) s += `<line x1="${cx}" y1="${y - 56}" x2="${cx}" y2="${y + 14}" stroke="${HAIR}" stroke-width="1"/>`;
    s += `<text x="${cx + (i ? 24 : 2)}" y="${y - 12}" font-family="${SERIF}" font-weight="700" font-size="50" fill="${GOLD}">${esc(it.big)}</text>`;
    s += `<text x="${cx + (i ? 26 : 4)}" y="${y + 12}" font-family="${MONO}" font-weight="500" font-size="15" letter-spacing="1" fill="${MUTE}">${esc(it.label)}</text>`;
  });
  return s + `<line x1="${M}" y1="${y + 14}" x2="${W - M}" y2="${y + 14}" stroke="${HAIR}" stroke-width="1"/>`;
}
function folio(n) { return `<text x="${W - 40}" y="${H - 150}" text-anchor="end" font-family="${SERIF}" font-weight="900" font-size="420" fill="${GOLD}" fill-opacity="0.05">${esc(n)}</text>`; }

function bgSolid() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="v" cx="0.5" cy="0.4" r="0.85"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient></defs><rect width="${W}" height="${H}" fill="${BG}"/><rect width="${W}" height="${H}" fill="url(#v)"/></svg>`;
}
const fgWrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">${inner}</svg>`.replace(/<text (?!xml:space)/g, '<text xml:space="preserve" ');

async function makePhoto(src, w, h, pos, feather) {
  const pw = w * SCALE, ph = h * SCALE;
  let buf = await sharp(src).resize({ width: pw, height: ph, fit: 'cover', position: pos, kernel: 'lanczos3' })
    .modulate({ brightness: 1.02, saturation: 1.05 }).linear(1.07, -5).tint({ r: 255, g: 246, b: 228 }).sharpen({ sigma: 0.5 }).png().toBuffer();
  if (feather) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.34" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${pw}" height="${ph}" fill="url(#g)"/></svg>`);
    buf = await sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  }
  return buf;
}

// lesson factory
function lesson({ idx, no, title, text, fig, stats, tsize = 60 }) {
  let inner = head(idx) + folio(no);
  inner += `<text x="${M}" y="208" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="4" fill="${GOLD}">УРОК ${no} / 07</text>`;
  inner += `<line x1="${M + 150}" y1="201" x2="${W - M}" y2="201" stroke="${HAIR}" stroke-width="1"/>`;
  inner += titleBlock(title, 300, title.length > 1 ? tsize : tsize + 8, tsize + 12);
  const by = title.length > 1 ? 300 + (tsize + 12) * (title.length - 1) + 130 : 470;
  inner += bodyBlock(text, by);
  if (stats) inner += statLine(stats, 1130);
  inner += foot(fig);
  return { mode: 'solid', fg: fgWrap(inner) };
}

const SL = [];

// S1 COVER (full-bleed portrait)
SL.push({
  mode: 'photo', src: PORTRAIT, pos: 'attention',
  overlay: `<defs><linearGradient id="b" x1="0" x2="0" y1="0" y2="1"><stop offset="0.32" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#0a0603" stop-opacity="0.72"/><stop offset="1" stop-color="#070402" stop-opacity="0.97"/></linearGradient><radialGradient id="vg" cx="0.5" cy="0.4" r="0.8"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/><rect width="${W}" height="${H}" fill="url(#vg)"/>`,
  fg: fgWrap(
    emb(M, 56, 42)
    + `<text x="${M + 74}" y="92" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="3" fill="${PAPER}" fill-opacity="0.85">@tradeliketyo</text>`
    + `<text x="${W - M}" y="92" text-anchor="end" font-family="${MONO}" font-weight="500" font-size="18" letter-spacing="2" fill="${GOLD}">EST. 14Y</text>`
    + `<line x1="${M}" y1="112" x2="${W - M}" y2="112" stroke="rgba(244,236,222,0.18)" stroke-width="1"/>`
    + `<text x="${M}" y="1000" font-family="${MONO}" font-weight="600" font-size="22" letter-spacing="4" fill="${GOLD}">14 ЛЕТ В ТРЕЙДИНГЕ</text>`
    + `<text x="${M - 4}" y="1104" font-family="${SERIF}" font-weight="700" font-size="98" fill="${PAPER}">7 вещей,</text>`
    + `<text x="${M - 4}" y="1192" font-family="${SERIF}" font-weight="700" font-size="64" font-style="italic" fill="${PAPER}">которые я усвоил</text>`
    + `<line x1="${M}" y1="1228" x2="380" y2="1228" stroke="${GOLD}" stroke-width="2"/>`
    + `<text x="${M}" y="1272" font-family="${MONO}" font-weight="500" font-size="22" fill="${PAPER}" fill-opacity="0.8">на собственном счёте</text>`
  )
});

SL.push(lesson({ idx: '02', no: '01', fig: 'I — РАБОТА',
  title: [[{ t: 'Не бросайте работу' }], [{ t: 'ради ' }, { t: 'трейдинга', c: GOLD, it: true }]],
  text: 'Новички думают, что достаточно открыть счёт, и рынок начнёт оплачивать их расходы. Рынок никому ничего не должен, и он об этом не предупреждает. Сначала докажите себе, что можете стабильно работать по системе. Только после этого трейдинг заслуживает право заменить вашу зарплату.' }));

SL.push(lesson({ idx: '03', no: '02', fig: 'II — РЫНОК',
  title: [[{ t: 'Рынку безразличны' }], [{ t: 'ваши ' }, { t: 'обстоятельства', c: GOLD, it: true }]], tsize: 54,
  text: 'Ему всё равно, что у вас кредит, аренда и дети. Он движется тогда, когда хочет, а не тогда, когда вам нужно. Когда вы это принимаете, убыток перестаёт быть катастрофой и становится частью работы. Это не смирение, это профессиональная зрелость.' }));

SL.push(lesson({ idx: '04', no: '03', fig: 'III — RISK',
  title: [[{ t: 'Риск-менеджмент' }], [{ t: 'важнее ' }, { t: 'точки входа', c: GOLD, it: true }]],
  text: 'Вы можете ошибаться в половине сделок и всё равно закрывать год в плюс. Я торгую с риском 0,25% на сделку, и именно это держит счёт живым во время просадок. Без контроля риска даже лучшая стратегия обнулит депозит. Капитал нужно защищать раньше, чем думать о прибыли.',
  stats: [{ big: '0,25%', label: 'РИСК / СДЕЛКА' }, { big: '50%', label: 'ОШИБОК ДОПУСТИМО' }, { big: '+', label: 'ГОД В ПЛЮС' }] }));

SL.push(lesson({ idx: '05', no: '04', fig: 'IV — STATS',
  title: [[{ t: 'Убыток — не провал,' }], [{ t: 'а ' }, { t: 'статистика', c: GOLD, it: true }]],
  text: 'В мае у меня закрылось в минус 6 сделок из 10. Итог по счёту: плюс 10%. Win rate 23% за 17 месяцев при среднем соотношении 9:1, и счёт растёт. Цель не в том, чтобы каждая сделка была прибыльной, а в том, чтобы математика работала на вашей стороне на дистанции.',
  stats: [{ big: '23%', label: 'WIN RATE' }, { big: '9:1', label: 'СРЕДНИЙ R' }, { big: '+10%', label: 'МАЙ' }] }));

SL.push(lesson({ idx: '06', no: '05', fig: 'V — SETUP', tsize: 52,
  title: [[{ t: 'Анализируйте за' }], [{ t: 'терминалом', c: GOLD, it: true }, { t: ', не за телефоном' }]],
  text: 'Телефон убирает из решения самое важное: контекст и хладнокровие. Маленький экран не даёт видеть структуру рынка целиком, и вы заходите в сделку по ощущению, а не по системе. Системный трейдинг начинается за нормальным монитором, с полным графиком и без уведомлений.' }));

SL.push(lesson({ idx: '07', no: '06', fig: 'VI — PATH',
  title: [[{ t: 'Деньги приходят' }], [{ t: 'последними', c: GOLD, it: true }]],
  text: 'Сначала сотни часов на графиках. Потом первые убытки и желание всё бросить. Потом понимание, что система важнее эмоций. Потом дисциплина, которая держит вас в системе даже когда три месяца подряд в минус. И только после всего этого появляется стабильность, за которой следует результат.' }));

SL.push(lesson({ idx: '08', no: '07', fig: 'VII — GRIT',
  title: [[{ t: 'Не останавливайтесь' }], [{ t: 'раньше ' }, { t: 'времени', c: GOLD, it: true }]],
  text: 'Я нашёл ошибку в собственном бэктесте после сотен часов работы. Всё сделанное казалось выброшенным. Я не остановился, переделал с нуля и получил результат лучше, чем был. Самые прибыльные трейдеры за 14 лет отличались не талантом. Они просто не уходили тогда, когда становилось тяжело.' }));

// S9 CTA
SL.push({
  mode: 'photo', src: SITTING, pos: 'top',
  overlay: `<defs><linearGradient id="b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#070402" stop-opacity="0.78"/><stop offset="0.4" stop-color="#070402" stop-opacity="0.55"/><stop offset="0.66" stop-color="#070402" stop-opacity="0.9"/><stop offset="1" stop-color="#050301" stop-opacity="0.99"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#b)"/>`,
  fg: fgWrap(
    head('09')
    + `<text x="${W / 2}" y="760" text-anchor="middle" font-family="${MONO}" font-weight="600" font-size="20" letter-spacing="4" fill="${GOLD}">КОНСПЕКТ 14 ЛЕТ</text>`
    + `<text x="${W / 2}" y="868" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="76" fill="${PAPER}">Полная система —</text>`
    + `<text x="${W / 2}" y="950" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="76" font-style="italic" fill="${GOLD}">в мини-курсе</text>`
    + `<text x="${W / 2}" y="1024" text-anchor="middle" font-family="${MONO}" font-weight="500" font-size="23" fill="${BODY}">Бесплатно. Ссылка в описании профиля.</text>`
    + `<rect x="${W / 2 - 250}" y="1080" width="500" height="78" rx="39" fill="none" stroke="${GOLD}" stroke-width="1.5"/>`
    + `<text x="${W / 2}" y="1129" text-anchor="middle" font-family="${MONO}" font-weight="700" font-size="24" letter-spacing="2" fill="${GOLD}">СМОТРЕТЬ СИСТЕМУ →</text>`
    + foot('IX — CTA')
  )
});

(async () => {
  for (let i = 0; i < SL.length; i++) {
    const s = SL[i];
    let out;
    if (s.mode === 'photo') {
      const photo = await makePhoto(s.src, W, H, s.pos, false);
      out = sharp(photo).composite([{ input: await R(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s.overlay}</svg>`) }, { input: await R(s.fg) }]);
    } else {
      out = sharp(await R(bgSolid())).composite([{ input: await R(s.fg) }]);
    }
    const f = `.carousel/out/noir-${String(i + 1).padStart(2, '0')}.png`;
    await out.png({ compressionLevel: 9 }).toFile(f);
    console.log('rendered', f);
  }
})();
