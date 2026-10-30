import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Журнал решений для кабинета v2 (29.10.2026): те же записи, что в терминале, — решения Сергея «ДОПУСК / ОТКАЗ»
 * с причиной и итоги сделок. Только настоящие данные из market_feed. 30.10.2026: проба открыта целиком, как подписка, —
 * пробный читает то же, без задержки. Без доступа к терминалу — пусто.
 */
export interface JVerdict {
  time: string;
  instrument: string;
  side: string;
  scenario?: string;
  verdict: 'ДОПУСК' | 'ОТКАЗ';
  reason?: string;
  pic?: string | null;
}
export interface JOutcome {
  time: string;
  instrument: string;
  side: string;
  result?: string;
  text?: string;
}

export function useJournal(opts: { userId?: string; open: boolean }) {
  const { userId, open } = opts;
  const [verdicts, setVerdicts] = useState<JVerdict[]>([]);
  const [outcomes, setOutcomes] = useState<JOutcome[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!userId || !open) { setLoaded(true); return; }
    let alive = true;
    const db = supabase as unknown as SupabaseClient;
    (async () => {
      const { data } = await db.from('market_feed').select('key, data').in('key', ['verdicts', 'outcomes']);
      if (!alive) return;
      const rows = (data || []) as { key: string; data: { items?: unknown[] } | null }[];
      setVerdicts((rows.find((r) => r.key === 'verdicts')?.data?.items || []) as JVerdict[]);
      setOutcomes((rows.find((r) => r.key === 'outcomes')?.data?.items || []) as JOutcome[]);
      setLoaded(true);
    })().catch(() => setLoaded(true));
    return () => { alive = false; };
  }, [userId, open]);
  const byTime = (a: { time: string }, b: { time: string }) => new Date(b.time).getTime() - new Date(a.time).getTime();
  return { verdicts: [...verdicts].sort(byTime), outcomes: [...outcomes].sort(byTime), loaded };
}

/**
 * Сделки решения в R из записи итога — то же правило, что в терминале (components/terminal/Feeds.tsx, tradesOfResult):
 * «ТЕЙК 10,8 к 1» → [+10,8] · «2 СТОПА · −2 R» → [−1, −1] · «БЕЗУБЫТОК» → [0]; не входил, в работе — [].
 */
export function tradesOfResult(r?: string): number[] {
  if (!r || !/ВОШЁЛ/.test(r) || /В РАБОТЕ|ЖДЁТ/.test(r)) return [];
  const n = (x: string) => parseFloat(x.replace(',', '.'));
  const out: number[] = [];
  for (const m of r.matchAll(/ТЕЙК\s+([\d,.]+)\s*к\s*1/g)) out.push(n(m[1]));
  const cnt = r.match(/(\d+)\s*СТОП/);
  const rr = r.match(/[−-]\s*([\d,.]+)\s*R/);
  if (cnt) {
    const k = parseInt(cnt[1], 10);
    const each = rr ? -n(rr[1]) / k : -1;
    for (let i = 0; i < k; i++) out.push(each);
  } else if (rr) out.push(-n(rr[1]));
  const pr = r.match(/\+\s*([\d,.]+)\s*R/);
  if (pr) out.push(n(pr[1]));
  if (!cnt && !rr && /СТОП/.test(r)) out.push(-1);
  if (!out.length && /БЕЗУБЫТОК|≈\s*0/.test(r)) out.push(0);
  return out;
}

/** время решения по Астане (UTC+5): «чт 29 окт, 14:05» */
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MO = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function whenAstana(time: string, withTime = true) {
  const d = new Date(new Date(time).getTime() + 5 * 3600e3);
  if (Number.isNaN(d.getTime())) return '';
  const hm = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}${withTime ? `, ${hm}` : ''}`;
}

export const fmtR = (v: number, digits = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(digits).replace('.', ',')}R`;
export const sideRu = (s: string) => (/BUY|LONG|покуп/i.test(s) ? 'покупка' : /SELL|SHORT|прод/i.test(s) ? 'продажа' : s);
