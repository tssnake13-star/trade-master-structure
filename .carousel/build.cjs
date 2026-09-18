const sharp = require('sharp');
const fs = require('fs');

const W = 1080, H = 1423;
const GOLD = '#FFC801';
const WHITE = '#FFFFFF';
const GREY = '#C7C7C7';
const X0 = 64;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// segments: [{t, gold, color}] -> tspans
function spans(segs, defColor) {
  return segs.map(s => `<tspan fill="${s.gold ? GOLD : (s.color || defColor)}">${esc(s.t)}</tspan>`).join('');
}

// ---- icons (24x24 viewBox, gold stroke) ----
const ICONS = {
  chart: `<polyline points="3 17 9 11 13 15 21 6" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15 6 21 6 21 12" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  bars: `<rect x="3" y="13" width="4" height="8" fill="${GOLD}"/><rect x="10" y="8" width="4" height="13" fill="${GOLD}"/><rect x="17" y="3" width="4" height="18" fill="${GOLD}"/>`,
  bulb: `<path d="M9 18h6M10 21h4M12 2a7 7 0 0 0-4 12c.6.6 1 1.4 1 2h6c0-.6.4-1.4 1-2A7 7 0 0 0 12 2z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  shield: `<path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>`,
  target: `<circle cx="12" cy="12" r="9" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="12" cy="12" r="1.4" fill="${GOLD}"/>`,
  clock: `<circle cx="12" cy="12" r="9" fill="none" stroke="${GOLD}" stroke-width="2"/><polyline points="12 7 12 12 16 14" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  person: `<circle cx="12" cy="8" r="4" fill="none" stroke="${GOLD}" stroke-width="2"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`,
  brain: `<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 8 18a3 3 0 0 0 4 1 3 3 0 0 0 4-1 3 3 0 0 0 3-5.2A3 3 0 0 0 18 7a3 3 0 0 0-3-3 3 3 0 0 0-3 1 3 3 0 0 0-3-1z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/><path d="M12 5v14" stroke="${GOLD}" stroke-width="1.5"/>`,
  heart: `<path d="M12 21C5 16 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 16 12 21z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>`,
  bookmark: `<path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>`,
  share: `<circle cx="6" cy="12" r="2.5" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="18" cy="6" r="2.5" fill="none" stroke="${GOLD}" stroke-width="2"/><circle cx="18" cy="18" r="2.5" fill="none" stroke="${GOLD}" stroke-width="2"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" stroke="${GOLD}" stroke-width="2"/>`,
  bell: `<path d="M6 16V10a6 6 0 0 1 12 0v6l2 2H4l2-2z" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="${GOLD}" stroke-width="2"/>`,
};
function icon(name, x, y, size) {
  const s = size / 24;
  return `<g transform="translate(${x},${y}) scale(${s})">${ICONS[name]}</g>`;
}

// faint candlestick chart motif (background)
function chartMotif() {
  let r = 0; const seed = 7;
  const rnd = () => { r = (r * 9301 + 49297 + seed) % 233280; return r / 233280; };
  let g = `<g opacity="0.14">`;
  const baseY = 1000, n = 26, step = 38, x0 = 120;
  let prev = baseY;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    const drift = Math.sin(i / 3) * 90 - i * 6;
    const mid = baseY + drift + (rnd() - 0.5) * 60;
    const bodyH = 18 + rnd() * 46;
    const up = rnd() > 0.45;
    const col = up ? '#39B271' : '#D5483B';
    const wick = bodyH + 20 + rnd() * 40;
    g += `<line x1="${x}" y1="${mid - wick / 2}" x2="${x}" y2="${mid + wick / 2}" stroke="${col}" stroke-width="2"/>`;
    g += `<rect x="${x - 9}" y="${mid - bodyH / 2}" width="18" height="${bodyH}" fill="${col}"/>`;
    prev = mid;
  }
  g += `</g>`;
  return g;
}

function background() {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#111111"/>
      <stop offset="0.5" stop-color="#070707"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.2" r="0.6">
      <stop offset="0" stop-color="#FFC801" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#FFC801" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${chartMotif()}
  <rect width="${W}" height="${H}" fill="url(#glow)"/>`;
}

// content slide
function contentSlide({ num, title, bullets, para, callout }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += background();

  // number
  s += `<text x="${X0}" y="172" font-family="Oswald" font-weight="700" font-size="118" fill="${GOLD}">${esc(num)}</text>`;
  s += `<rect x="${X0 + 4}" y="196" width="66" height="7" fill="${GOLD}"/>`;

  // title (uppercase), up to 2 lines
  let ty = 300;
  for (const line of title) {
    s += `<text x="${X0}" y="${ty}" font-family="Oswald" font-weight="700" font-size="72" letter-spacing="0.5">${spans(line, WHITE)}</text>`;
    ty += 80;
  }
  // divider
  let y = ty + 8;
  s += `<line x1="${X0}" y1="${y}" x2="${X0 + 380}" y2="${y}" stroke="${GOLD}" stroke-width="2" opacity="0.7"/>`;
  y += 60;

  // bullets
  for (const b of bullets) {
    s += icon(b.icon, X0, y - 30, 40);
    let by = y;
    // head line (bold)
    s += `<text x="${X0 + 78}" y="${by}" font-family="Montserrat" font-weight="700" font-size="35">${spans(b.head, WHITE)}</text>`;
    by += 44;
    for (const sub of (b.subs || [])) {
      s += `<text x="${X0 + 78}" y="${by}" font-family="Montserrat" font-weight="500" font-size="32">${spans(sub, GREY)}</text>`;
      by += 42;
    }
    y = by + 26;
  }

  // paragraph
  y += 6;
  for (const line of para) {
    s += `<text x="${X0}" y="${y}" font-family="Montserrat" font-weight="${line.bold ? 700 : 500}" font-size="33">${spans(line.segs, line.bold ? WHITE : GREY)}</text>`;
    y += 46;
  }

  // callout box at bottom
  const cw = 760, ch = 150, cx = X0, cy = H - 64 - ch;
  s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="16" fill="${GOLD}" fill-opacity="0.07" stroke="${GOLD}" stroke-width="2" stroke-opacity="0.8"/>`;
  s += icon(callout.icon || 'shield', cx + 30, cy + ch / 2 - 22, 44);
  let coy = cy + ch / 2 - (callout.lines.length * 21) + 22;
  for (const line of callout.lines) {
    s += `<text x="${cx + 100}" y="${coy}" font-family="Montserrat" font-weight="600" font-size="29">${spans(line, WHITE)}</text>`;
    coy += 40;
  }

  s += `</svg>`;
  return s;
}

// CTA slide
function ctaSlide({ kicker, title, subtitle, points, handle, action }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += background();
  // centered logo dot
  s += `<text x="${W / 2}" y="240" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="34" fill="${GOLD}" letter-spacing="4">${esc(kicker)}</text>`;
  let ty = 380;
  for (const line of title) {
    s += `<text x="${W / 2}" y="${ty}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="84" letter-spacing="0.5">${spans(line, WHITE)}</text>`;
    ty += 92;
  }
  s += `<text x="${W / 2}" y="${ty + 24}" text-anchor="middle" font-family="Montserrat" font-weight="500" font-size="34" fill="${GREY}">${esc(subtitle)}</text>`;

  let y = ty + 140;
  for (const p of points) {
    const bx = X0 + 70;
    s += icon(p.icon, bx, y - 30, 40);
    s += `<text x="${bx + 70}" y="${y}" font-family="Montserrat" font-weight="600" font-size="36">${spans(p.segs, WHITE)}</text>`;
    y += 86;
  }

  // action box
  const cw = W - 2 * (X0 + 30), cx = X0 + 30, ch = 168, cy = H - 80 - ch;
  s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="20" fill="${GOLD}"/>`;
  s += `<text x="${W / 2}" y="${cy + 70}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="52" fill="#080808">${esc(handle)}</text>`;
  s += `<text x="${W / 2}" y="${cy + 126}" text-anchor="middle" font-family="Montserrat" font-weight="600" font-size="30" fill="#0c0c0c">${esc(action)}</text>`;

  s += `</svg>`;
  return s;
}

// ---------- CONTENT ----------
const slides = [];

slides.push({ file: '06.png', svg: contentSlide({
  num: '06',
  title: [
    [{ t: 'ДИСЦИПЛИНА ' }, { t: 'ВАЖНЕЕ', gold: true }],
    [{ t: 'МОТИВАЦИИ', gold: true }],
  ],
  bullets: [
    { icon: 'bulb', head: [{ t: 'Мотивация заканчивается.' }], subs: [[{ t: 'Система остаётся.', gold: true }]] },
    { icon: 'brain', head: [{ t: 'Делать одно и то же —' }], subs: [[{ t: 'даже когда скучно и нет драйва.' }]] },
    { icon: 'shield', head: [{ t: 'Правила важнее настроения', gold: true }], subs: [[{ t: 'и сиюминутных эмоций.' }]] },
  ],
  para: [
    { segs: [{ t: 'Рынок платит не за вдохновение,' }] },
    { segs: [{ t: 'а за повторяемость действий.' }] },
    { segs: [{ t: 'Каждый день одно и то же — ' }, { t: 'вот что', gold: true }] , bold: true},
    { segs: [{ t: 'отличает профессионала от новичка.', gold: true }], bold: true },
  ],
  callout: { icon: 'shield', lines: [
    [{ t: 'Дисциплина сегодня —' }],
    [{ t: 'стабильный счёт завтра.', gold: true }],
  ] },
}) });

slides.push({ file: '07.png', svg: contentSlide({
  num: '07',
  title: [
    [{ t: 'ТЕРПЕНИЕ ' }, { t: 'ДОРОЖЕ', gold: true }],
    [{ t: 'ПРОГНОЗОВ', gold: true }],
  ],
  bullets: [
    { icon: 'clock', head: [{ t: 'Лучшие сделки приходят' }], subs: [[{ t: 'к тем, кто умеет ждать.', gold: true }]] },
    { icon: 'target', head: [{ t: 'Нет сетапа — нет сделки.', gold: true }], subs: [[{ t: 'Это не пропуск, а решение.' }]] },
    { icon: 'bars', head: [{ t: 'Деньги делаются в ожидании,' }], subs: [[{ t: 'а не в суете и переторговке.' }]] },
  ],
  para: [
    { segs: [{ t: 'Большинство убытков — это сделки' }] },
    { segs: [{ t: '«от скуки», а не по стратегии.' }] },
    { segs: [{ t: 'Умение сидеть на руках —', gold: true }], bold: true },
    { segs: [{ t: 'недооценённый навык трейдера.', gold: true }], bold: true },
  ],
  callout: { icon: 'clock', lines: [
    [{ t: 'Ждите своё.' }],
    [{ t: 'Рынок никуда не денется.', gold: true }],
  ] },
}) });

slides.push({ file: '08.png', svg: contentSlide({
  num: '08',
  title: [
    [{ t: 'ВЫ — ' }, { t: 'ГЛАВНАЯ', gold: true }],
    [{ t: 'ПЕРЕМЕННАЯ', gold: true }],
  ],
  bullets: [
    { icon: 'person', head: [{ t: 'Мешает не рынок —' }], subs: [[{ t: 'мешают ваши эмоции.', gold: true }]] },
    { icon: 'brain', head: [{ t: 'Страх и жадность', gold: true }], subs: [[{ t: 'сливают счета чаще,' }], [{ t: 'чем плохие стратегии.' }]] },
    { icon: 'target', head: [{ t: 'Работайте над собой,' }], subs: [[{ t: 'а не над индикаторами.', gold: true }]] },
  ],
  para: [
    { segs: [{ t: 'Графики у всех одинаковые.' }] },
    { segs: [{ t: 'Разные — только люди за экраном.' }] },
    { segs: [{ t: 'Ваш результат — это отражение', gold: true }], bold: true },
    { segs: [{ t: 'вашего мышления и привычек.', gold: true }], bold: true },
  ],
  callout: { icon: 'heart', lines: [
    [{ t: 'Прокачивайте психологию —' }],
    [{ t: 'это ваш главный актив.', gold: true }],
  ] },
}) });

slides.push({ file: '09.png', svg: ctaSlide({
  kicker: '14 ЛЕТ ОПЫТА — В ОДНОЙ КАРУСЕЛИ',
  title: [
    [{ t: 'СОХРАНИТЕ,' }],
    [{ t: 'ЧТОБЫ ', gold: false }, { t: 'НЕ ПОТЕРЯТЬ', gold: true }],
  ],
  subtitle: 'Без воды. Только то, что реально работает.',
  points: [
    { icon: 'bell', segs: [{ t: 'Подпишитесь, если торгуете ' }, { t: 'всерьёз', gold: true }] },
    { icon: 'bookmark', segs: [{ t: 'Сохраните пост ' }, { t: 'в закладки', gold: true }] },
    { icon: 'share', segs: [{ t: 'Поделитесь с тем, кто ' }, { t: 'сливает депозит', gold: true }] },
  ],
  handle: '@TRADE.MASTER',
  action: 'Напишите «СТАРТ» в директ',
}) });

(async () => {
  for (const sl of slides) {
    sl.svg = sl.svg.replace(/<text /g, '<text xml:space="preserve" ');
    await sharp(Buffer.from(sl.svg)).png().toFile('.carousel/out/' + sl.file);
    console.log('rendered', sl.file);
  }
})();
