// Разбор скринера подписчика — тех двух сообщений, что бот шлёт после «✅ ОДОБРЯЮ»
// (format_groups_for_channel и format_top_for_channel). С 21.09.2026 подписчик получает
// их в новом виде, а мост кладёт сюда прежний текст (groups_raw / top_raw): экран сам
// раскладывает его по карточкам. Не разобралось — экран покажет текст как есть.

export type Side = 'up' | 'down' | 'flat';

export interface ScrInstrument {
  symbol: string;
  side: 'LONG' | 'SHORT';
  // сколько из трёх критериев недели за сторону пары (2 или 3). 21.09.2026: вместо значка
  // режима рынка — режим убран его решением, третий критерий теперь накопления
  score: number | null;
}

export interface ScrGroup {
  code: string;
  name: string;
  dir: Side;
  trade: string; // BUY / SELL / MIXED …
  macro: 'за' | 'против' | 'нейтрально' | null;
  week: { arrow: Side; text: string };
  day: { arrow: Side; text: string };
  // почему сторона группы не совпала с неделей (25.09.2026): «сценарий 2» или «по дневке»
  note: string | null;
  range: string | null;
  acc: { verdict: 'за' | 'против' | 'спор' | null; text: string } | null;
  leader: string | null; // поводырь группы: «индекс доллара», USDJPY, AUDUSD…
  instruments: ScrInstrument[];
}

export interface ScrTop {
  rank: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  scenario: string | null;
  tags: string[];
  week: { angle: string | null; passed: number | null; reserve: string | null };
  day: { angle: string | null; passed: number | null; reserve: string | null };
  range: string | null;
  acc: string | null;
  agree: boolean;
  leads: string | null; // инструмент сам поводырь группы — её название в родительном: «новозеландца»
}

export interface ScrParsed {
  groups: ScrGroup[];
  top: ScrTop[];
  fresh: string[]; // «свежие развороты, отмены и ложные выходы»
}

const NAMES: Record<string, string> = {
  DXY: 'Доллар', JPY: 'Йена', AUD: 'Австралиец', NZD: 'Новозеландец', GBP: 'Фунт', CHF: 'Франк',
  CAD: 'Канадец', EUR: 'Евро', GOLD: 'Золото', OIL: 'Нефть', BTC: 'Биткоин',
};
// «поводырь группы йены» — его слово 21.09.2026: у поводырей поводырей нет, они сами поводыри
export const GEN: Record<string, string> = {
  DXY: 'доллара', JPY: 'йены', AUD: 'австралийца', NZD: 'новозеландца', GBP: 'фунта', CHF: 'франка',
  CAD: 'канадца', EUR: 'евро', GOLD: 'золота', OIL: 'нефти', BTC: 'биткоина', // «группа биткоина» — его слово 21.09.2026
};

// «месяц с июня 2026, неделя с 16.08.2026» → «месяц с июня, неделя с 16.08»: год и так понятен
const shortDates = (t: string) => t.replace(/(\d{2}\.\d{2})\.20\d{2}/g, '$1').replace(/ 20\d{2}\b/g, '').trim();

const arrow = (a: string): Side => (a === '↑' ? 'up' : a === '↓' ? 'down' : 'flat');

function scoreWords(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/ручн/.test(t)) return 'вручную';
  const m = t.match(/(\d)\/(\d)(.*)$/);
  if (!m) return t;
  return `${m[1]} из ${m[2]}${m[3].trim() ? ' ' + m[3].trim() : ''}`;
}

export function parseGroups(text: string): ScrGroup[] {
  const out: ScrGroup[] = [];
  let cur: ScrGroup | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    // 25.09.2026: строка группы узнаётся по началу («значок, группа, → BUY / SELL · W1»), а неделя,
    // дневка и пометка ищутся в ней отдельно. Прежний строгий образец терял группу целиком, когда между
    // неделей и дневкой встала пометка «сценарий 2» (австралиец 25.09: вывод SHORT при неделе вверх),
    // и её рейндж и накопления уходили к соседней группе.
    const g = line.match(/^(📈|📉|➖|❓|🚫)\s+(.+?)\s*(🟢|⚪|⛔)?\s*→\s*([A-Z]+)\s*·\s*W1/u);
    if (g) {
      const w = line.match(/·\s*W1\s*([↑↓~—])\s*(?:\[([^\]]*)\])?/u);
      const d = line.match(/·\s*D1\s*([↑↓~—])\s*(?:\[([^\]]*)\])?/u);
      const n = line.match(/·\s*(сценарий\s*\d+|по дневке)/u);
      const label = g[2].trim();
      const code = (label.match(/\(([A-Z]+)\)\s*$/) || [])[1] || label.replace(/[^A-Z]/g, '') || label;
      cur = {
        code,
        name: NAMES[code] || label.replace(/^Группа\s+/i, ''),
        dir: g[4] === 'BUY' ? 'up' : g[4] === 'SELL' ? 'down' : 'flat',
        trade: g[4],
        macro: g[3] === '🟢' ? 'за' : g[3] === '⛔' ? 'против' : g[3] === '⚪' ? 'нейтрально' : null,
        week: { arrow: arrow(w ? w[1] : '~'), text: scoreWords((w && w[2]) || '') },
        day: { arrow: arrow(d ? d[1] : '~'), text: scoreWords((d && d[2]) || '') },
        note: n ? n[1].replace(/\s+/g, ' ') : null,
        range: null,
        acc: null,
        leader: code === 'DXY' ? 'индекс доллара' : null,
        instruments: [],
      };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    const r = line.match(/^⚠️?\s*рейндж у [^:]+:\s*(.+)$/u);
    if (r) {
      cur.range = shortDates(r[1]);
      continue;
    }
    const a = line.match(/^📈\s*накопления у ([^—]+?)\s*—\s*(.+)$/u);
    if (a) {
      const who = a[1].trim();
      cur.leader = /индекс/.test(who) ? 'индекс доллара' : who;
      const body = a[2];
      const verdict = /в сторону группы/.test(body) ? 'за' : /против группы/.test(body) ? 'против' : /спорят/.test(body) ? 'спор' : null;
      cur.acc = { verdict, text: body.replace(/\s*·\s*(✅|⚠️)\s*[^·]*$/u, '').trim() };
      continue;
    }
    const ins = line.match(/^→\s*(.+)$/u);
    if (ins) {
      for (const part of ins[1].split(',')) {
        // 22.09.2026: у крипты в имени маленькая t («ETHUSDt») — берём и её, показываем ETHUSDT,
        // как в левом списке (иначе эфир в группе биткоина пропадал)
        const m = part.trim().match(/^([A-Z0-9_]+t?)\s+(LONG|SHORT)\s*(\S+)?/u);
        if (m) {
          // «3/3» — счёт пары (с 21.09.2026); значки режима из старого кэша не показываем
          const sc = (m[3] || '').match(/^([23])\/3$/);
          cur.instruments.push({ symbol: m[1].toUpperCase(), side: m[2] as 'LONG' | 'SHORT', score: sc ? +sc[1] : null });
        }
      }
      continue;
    }
    if (/^📌/u.test(line)) cur = null; // дальше — пояснения значков
  }
  return out;
}

export function parseTop(text: string): { top: ScrTop[]; fresh: string[] } {
  const top: ScrTop[] = [];
  const fresh: string[] = [];
  let cur: ScrTop | null = null;
  let tf: 'week' | 'day' | null = null;
  let inFresh = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^📈\s*Накопления — свежие/u.test(line)) {
      inFresh = true;
      cur = null;
      continue;
    }
    if (inFresh) {
      if (line.startsWith('•')) fresh.push(line.replace(/^•\s*/, ''));
      continue;
    }
    const h = line.match(/^(\d+)\.\s+([A-Z0-9_]+t?)\s+(LONG|SHORT)\s*·?\s*(.*)$/);
    if (h) {
      const tags = h[4].split('·').map((t) => t.replace(/🔥/gu, '').trim()).filter(Boolean);
      const sc = tags.find((t) => /^сценарий/.test(t));
      cur = {
        rank: +h[1],
        symbol: h[2].toUpperCase(),
        side: h[3] as 'LONG' | 'SHORT',
        scenario: sc ? sc.replace(/^сценарий\s*/, '') : null,
        tags: tags.filter((t) => !/^сценарий/.test(t)),
        week: { angle: null, passed: null, reserve: null },
        day: { angle: null, passed: null, reserve: null },
        range: null,
        acc: null,
        agree: false,
        leads: null,
      };
      top.push(cur);
      tf = null;
      continue;
    }
    if (!cur) continue;
    const ang = line.match(/^(W1|D1)\s+угол\s+(\S+)/);
    if (ang) {
      tf = ang[1] === 'W1' ? 'week' : 'day';
      cur[tf].angle = ang[2];
      continue;
    }
    const p = line.match(/^пройдено\s+(\d+)%.*?запас\s+[^(]*\(([\d.,]+)\s*ATR\)/);
    if (p && tf && cur[tf].passed == null) {
      cur[tf].passed = +p[1];
      cur[tf].reserve = p[2].replace('.', ',');
      continue;
    }
    const r = line.match(/^⚠️?\s*рейндж:\s*(.+)$/u);
    if (r) {
      cur.range = shortDates(r[1]);
      continue;
    }
    const a = line.match(/^📈\s*накопления\s*—\s*(.+)$/u);
    if (a) {
      cur.acc = a[1].trim();
      continue;
    }
    if (/в одну сторону/.test(line)) cur.agree = true;
  }
  return { top, fresh };
}

/**
 * leaders — «код группы → поводырь», мост берёт его из screener.LEADERS (тот же источник,
 * что у скринера). Нет его — поводырь берётся из строки «накопления у …».
 */
export function parseScreener(
  groups: string | null | undefined,
  top: string | null | undefined,
  leaders?: Record<string, string> | null,
): ScrParsed {
  const t = parseTop(top || '');
  const gs = parseGroups(groups || '');
  const lead: Record<string, string> = { ...(leaders || {}) };
  for (const g of gs) {
    if (leaders?.[g.code]) g.leader = leaders[g.code];
    if (g.leader && !lead[g.code]) lead[g.code] = g.leader;
  }
  for (const x of t.top) {
    const code = Object.keys(lead).find((c) => c !== 'DXY' && lead[c] === x.symbol);
    x.leads = code ? GEN[code] || NAMES[code] || code : null;
    // у самого поводыря индекс доллара рядом — сверка, а не «его поводырь»
    if (x.leads && x.range) x.range = x.range.replace(/\s*\(поводырь\)/g, '');
  }
  return { groups: gs, top: t.top, fresh: t.fresh };
}
