import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, Lock, MessageCircle, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardTextKey } from '@/lib/dashboardTexts';
import type { Course, Lesson } from '@/pages/SchoolDashboard';
import DropGroup from './DropGroup';
import RChart, { type RPoint } from './RChart';
import Expand from './Expand';
import Countdown from './Countdown';
import { fmtR, sideRu, tradesOfResult, whenAstana, type JOutcome, type JVerdict } from './journal';

export type TFn = (key: DashboardTextKey, vars?: Record<string, string | number>) => string;
const DM = 'https://t.me/tradeliketyo';
const inStyle = (i: number) => ({ '--i': i } as CSSProperties);

/* ---------- кольцо прогресса ---------- */
export function Ring({ pct, size = 108 }: { pct: number; size?: number }) {
  const r = size / 2 - 8, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="cv2-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="trk" cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none" />
        <circle className="val" cx={size / 2} cy={size / 2} r={r} strokeWidth={8} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ animation: 'cv2Ring 1.4s var(--ease) both', '--c': c } as CSSProperties} />
      </svg>
      <b className="num">{v}%</b>
    </div>
  );
}

/* ---------- продолжить обучение ---------- */
export function ContinueCard({ course, progress, next, after = [], onOpen, onCourse, t, i = 0 }: {
  course: Course | null; progress: { completed: number; total: number } | null; next: Lesson | null;
  /** следующие блоки программы после текущего: номер, открыт ли */
  after?: { lesson: Lesson; num: number; open: boolean }[];
  onOpen: (id: string) => void; onCourse?: () => void; t: TFn; i?: number;
}) {
  const pct = progress && progress.total ? (progress.completed / progress.total) * 100 : 0;
  const done = !!progress && progress.total > 0 && progress.completed >= progress.total;
  return (
    <article className="cv2-card cv2-glass s5 cv2-in" style={inStyle(i)}>
      <div className="cv2-card-head">
        <div>
          <h3>{done ? t('continue_done_title') : next ? 'Продолжить обучение' : t('continue_pending_title')}</h3>
          <div className="cv2-sub">{course ? `${course.title}${progress?.total ? ` · ${progress.completed} из ${progress.total} блоков` : ''}` : '—'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
        <Ring pct={pct} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {next ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{next.title}</div>
              <div className="cv2-sub" style={{ marginTop: 6 }}>{t('continue_meta_video')} · {t('continue_meta_pdf')}</div>
              <button type="button" className="cv2-btn cv2-btn-brass" style={{ marginTop: 14 }} onClick={() => onOpen(next.id)}>
                {t('continue_open')} <ArrowRight size={15} />
              </button>
            </>
          ) : (
            <div className="cv2-sub" style={{ fontSize: 14 }}>{done ? 'Все блоки пройдены.' : 'Следующий блок откроется, когда я проверю задание.'}</div>
          )}
        </div>
      </div>
      {/* дальше по программе — настоящие следующие блоки; карточка рядом с итогами в R не стоит пустой */}
      {after.length > 0 && (
        <div className="cv2-next">
          <div className="cv2-sub">Дальше по программе</div>
          {after.map(({ lesson, num, open }) => (
            <button key={lesson.id} type="button" className="cv2-next-row" data-locked={!open || undefined}
              onClick={() => (open ? onOpen(lesson.id) : onCourse?.())}>
              <span className="n num">{String(num).padStart(2, '0')}</span>
              <span className="tt">{lesson.title}</span>
              {open ? <ArrowRight size={14} /> : <Lock size={13} />}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ---------- итоги решений в R: карточка, которая разворачивается ---------- */
type Period = '30' | '90' | 'all';
function seriesOf(outcomes: JOutcome[], period: Period) {
  const cut = period === 'all' ? 0 : Date.now() - Number(period) * 86400000;
  // по времени от старых к новым — не полагаемся на порядок, в котором пришли данные
  const rows = [...outcomes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).filter((o) => new Date(o.time).getTime() >= cut)
    .map((o) => ({ o, trades: tradesOfResult(o.result) })).filter((x) => x.trades.length);
  let sum = 0;
  const pts: RPoint[] = [{ label: '', value: 0 }];
  for (const { o, trades } of rows) {
    sum += trades.reduce((a, b) => a + b, 0);
    pts.push({ label: whenAstana(o.time, false).replace(/^\S+ /, ''), value: Math.round(sum * 10) / 10, note: `${o.instrument} ${sideRu(o.side)}` });
  }
  if (pts.length > 1) pts[0].label = pts[1].label;
  const wins = rows.flatMap((x) => x.trades).filter((v) => v > 0).length;
  const total = rows.flatMap((x) => x.trades).filter((v) => v !== 0).length;
  return { pts, sum, rows, wins, total };
}

export function RCard({ outcomes, onDim, i = 0 }: { outcomes: JOutcome[]; onDim: (on: boolean) => void; i?: number }) {
  const [period, setPeriod] = useState<Period>('90');
  const s = useMemo(() => seriesOf(outcomes, period), [outcomes, period]);
  const card = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const avgWin = useMemo(() => {
    const w = s.rows.flatMap((x) => x.trades).filter((v) => v > 0);
    return w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0;
  }, [s]);
  const openPanel = () => { setOpen(true); onDim(true); };
  return (
    <>
      <article ref={card} className="cv2-card cv2-glass s7 cv2-in" style={{ ...inStyle(i), cursor: 'pointer' }} tabIndex={0} role="button"
        aria-label="Открыть итоги решений" onClick={openPanel} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); } }}>
        <div className="cv2-card-head">
          <div><h3>Итоги решений в R</h3><div className="cv2-sub">Каждое решение записано до движения цены</div></div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropGroup<Period> label="Период" variant="sm brass" value={period} onChange={setPeriod}
              items={[{ key: '30', label: '30 дней' }, { key: '90', label: '90 дней' }, { key: 'all', label: 'Всё' }]} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="cv2-big num">{fmtR(s.sum)}</span>
          {s.total > 0 && <span className="cv2-sub">{s.total} сделок · прибыльных {s.wins}, в среднем {fmtR(avgWin)} на прибыльную при стопе 1R</span>}
        </div>
        <RChart points={s.pts} height={230} />
        <div className="cv2-hint" style={{ marginTop: 4 }}>Нажмите, чтобы открыть все итоги</div>
      </article>
      {open && card.current && (
        <Expand from={card.current} label="Итоги решений" onClosed={() => { setOpen(false); onDim(false); }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }} className="cv2-panel-grid">
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Итоги решений в R</h3>
              <div className="cv2-sub">{period === 'all' ? 'за всё время журнала' : `за ${period} дней`} · по Астане</div>
              <div className="cv2-big num" style={{ marginTop: 14 }}>{fmtR(s.sum)}</div>
              <RChart points={s.pts} height={300} />
            </div>
            <div style={{ minWidth: 0, maxHeight: '100%', overflow: 'auto' }}>
              {[...s.rows].reverse().map(({ o, trades }) => {
                const r = trades.reduce((a, b) => a + b, 0);
                return (
                  <div key={`${o.time}${o.instrument}`} className="cv2-row" style={{ gridTemplateColumns: '108px 1fr auto' }}>
                    <time>{whenAstana(o.time, false)}</time>
                    <span><b>{o.instrument}</b> <span className="cv2-sub" style={{ display: 'inline' }}>{sideRu(o.side)}</span></span>
                    <span className="num" style={{ fontFamily: 'var(--mono)', color: r > 0 ? 'var(--ok)' : r < 0 ? 'var(--soft)' : 'var(--mut)' }}>{fmtR(r)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Expand>
      )}
    </>
  );
}

/* ---------- счётчики программы ---------- */
export function KpiStrip({ daysInSystem, programEnd, progress, i = 0 }: {
  daysInSystem: number; programEnd: Date | null; progress: { completed: number; total: number } | null; i?: number;
}) {
  const totalDays = programEnd && daysInSystem >= 0 ? Math.max(daysInSystem, Math.round((programEnd.getTime() - Date.now()) / 86400000) + daysInSystem) : null;
  const left = programEnd ? Math.max(0, Math.ceil((programEnd.getTime() - Date.now()) / 86400000)) : null;
  const tiles: { label: string; value: ReactNode }[] = [
    { label: 'Дней в программе', value: <>{daysInSystem}{totalDays ? <span style={{ color: 'var(--faint)', fontSize: 22 }}> / {totalDays}</span> : null}</> },
    { label: 'Пройдено блоков', value: <>{progress?.completed ?? 0}{progress?.total ? <span style={{ color: 'var(--faint)', fontSize: 22 }}> / {progress.total}</span> : null}</> },
    { label: 'Осталось блоков', value: progress ? Math.max(0, progress.total - progress.completed) : '—' },
    { label: 'До конца доступа', value: left != null ? <>{left}<span style={{ color: 'var(--faint)', fontSize: 22 }}> дн</span></> : '—' },
  ];
  return (
    <div className="s12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
      {tiles.map((x, k) => (
        <div key={x.label} className="cv2-card cv2-glass cv2-in" style={inStyle(i + k)}>
          <div className="cv2-sub" style={{ marginTop: 0 }}>{x.label}</div>
          <div className="cv2-big num" style={{ marginTop: 10 }}>{x.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- решения ---------- */
type VF = 'all' | 'ok' | 'no';
export function VerdictRows({ items, seenMs, limit }: { items: JVerdict[]; seenMs?: number | null; limit?: number }) {
  const list = limit ? items.slice(0, limit) : items;
  if (!list.length) return <div className="cv2-hint" style={{ padding: '18px 10px' }}>Решений за этот период нет.</div>;
  return (
    <div style={{ marginTop: 10 }}>
      {list.map((v) => {
        const fresh = seenMs != null && new Date(v.time).getTime() > seenMs;
        return (
          <div key={`${v.time}${v.instrument}${v.side}`} className={`cv2-row${fresh ? ' fresh' : ''}`}>
            <time>{whenAstana(v.time)}</time>
            <span><b>{v.instrument}</b></span>
            <span className={`cv2-pill ${v.verdict === 'ДОПУСК' ? 'ok' : 'no'}`} style={{ justifySelf: 'start' }}>{v.verdict === 'ДОПУСК' ? 'Допуск' : 'Отказ'}</span>
            <span className="why">{sideRu(v.side)}{v.reason ? `: ${v.reason}` : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

export function VerdictsCard({ items, trial, seenMs, onOpenJournal, i = 0 }: {
  items: JVerdict[]; trial: boolean; seenMs?: number | null; onOpenJournal: () => void; i?: number;
}) {
  const [f, setF] = useState<VF>('all');
  const list = items.filter((v) => f === 'all' || (f === 'ok') === (v.verdict === 'ДОПУСК'));
  return (
    <article className="cv2-card cv2-glass s8 cv2-in" style={inStyle(i)}>
      <div className="cv2-card-head" style={{ flexWrap: 'wrap' }}>
        <div>
          <h3>Мои решения</h3>
          <div className="cv2-sub">{trial ? 'Пробный доступ: решения сразу, как у подписчиков' : 'Допуски и отказы с причиной, записаны до движения цены'}</div>
        </div>
        <DropGroup<VF> label="Фильтр решений" variant="sm" value={f} onChange={setF}
          items={[{ key: 'all', label: 'Все' }, { key: 'ok', label: 'Допуск' }, { key: 'no', label: 'Отказ' }]} />
      </div>
      <VerdictRows items={list} seenMs={seenMs} limit={6} />
      <button type="button" className="cv2-btn cv2-btn-ghost" style={{ marginTop: 12 }} onClick={onOpenJournal}>
        Весь журнал в терминале <ArrowRight size={15} />
      </button>
    </article>
  );
}

export function LockedEcosystemCard({ expired, i = 0 }: { expired: boolean; i?: number }) {
  return (
    <article className="cv2-card cv2-glass s8 cv2-in" style={inStyle(i)}>
      <div className="cv2-card-head"><div><h3>ECHO-GATE INSIDE</h3><div className="cv2-sub">Терминал и мой вердикт по каждой сделке</div></div><Lock size={18} style={{ color: 'var(--faint)' }} /></div>
      <p style={{ color: 'var(--soft)', margin: '14px 0 0', maxWidth: '58ch' }}>
        {expired
          ? 'Срок подписки закончился. Продлите её, и терминал с моими решениями снова откроется по кнопке с глазом.'
          : 'Программа каждый день смотрит весь рынок, я говорю, какую сделку беру и почему. Вы отмечаете вход и нажимаете кнопку, дальше сделку ведёт Hunter_Bot.'}
      </p>
      <a className="cv2-btn cv2-btn-brass" style={{ marginTop: 16 }} href={DM} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={15} /> {expired ? 'Продлить подписку' : 'Подключить ECHO-GATE INSIDE'}
      </a>
    </article>
  );
}

/* ---------- прямые эфиры ---------- */
export function LiveCard({ upcoming, i = 0, span = 's4' }: { upcoming: Date[]; i?: number; span?: string }) {
  const next = upcoming[0];
  const live = next && next.getTime() <= Date.now();
  const fmt = (d: Date) => {
    const a = new Date(d.getTime() + 5 * 3600e3);
    return `${['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][a.getUTCDay()]}, ${a.getUTCDate()} ${['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][a.getUTCMonth()]}`;
  };
  return (
    <article className={`cv2-card cv2-glass ${span} cv2-in`} style={inStyle(i)}>
      <div className="cv2-card-head">
        <div><h3>Прямой эфир</h3><div className="cv2-sub">Понедельник и четверг, 20:00 по Астане</div></div>
        {live && <span className="cv2-chip" style={{ color: 'var(--ok)' }}><span className="cv2-live" />идёт сейчас</span>}
      </div>
      {next && !live && <Countdown to={next} />}
      <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', fontSize: 13 }}>
        {upcoming.map((d) => (
          <li key={d.getTime()} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--line)', color: 'var(--soft)' }}>
            {fmt(d)}<span className="mono" style={{ color: 'var(--mut)', fontSize: 12 }}>20:00</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---------- программы ---------- */
export function ProgramsCard({ courses, hasAccess, progress, expiredAccess, onSelect, i = 0, span = 's8' }: {
  courses: Course[]; hasAccess: (c: Course) => boolean; progress: Record<string, { completed: number; total: number }>;
  expiredAccess: Map<string, Date>; onSelect: (id: string) => void; i?: number; span?: string;
}) {
  const list = [...courses].sort((a, b) => Number(hasAccess(b)) - Number(hasAccess(a)));
  return (
    <article className={`cv2-card cv2-glass ${span} cv2-in`} style={inStyle(i)}>
      <div className="cv2-card-head"><div><h3>Программы</h3><div className="cv2-sub">Нажмите на программу, чтобы открыть блоки</div></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
        {list.map((c) => {
          const ok = hasAccess(c), p = progress[c.id] || { completed: 0, total: 0 };
          const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
          return (
            <button key={c.id} type="button" onClick={() => onSelect(c.id)} className="cv2-prog" data-locked={!ok || undefined}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <b>{c.title}</b>{!ok && <Lock size={14} style={{ color: 'var(--faint)', flexShrink: 0 }} />}
              </span>
              <span className="cv2-sub" style={{ display: 'block' }}>
                {ok ? (p.total ? `${p.completed} из ${p.total} блоков` : c.subtitle || '') : expiredAccess.has(c.id) ? 'Доступ закончился' : 'Закрыто'}
              </span>
              {ok && p.total > 0 && <span className="cv2-progress" style={{ display: 'block', marginTop: 10 }}><i style={{ width: `${pct}%` }} /></span>}
            </button>
          );
        })}
      </div>
    </article>
  );
}

/* ---------- последняя активность ---------- */
export function ActivityCard({ items, t, i = 0, span = 's4' }: { items: { lesson_id: string; completed_at: string; lesson?: Lesson }[]; t: TFn; i?: number; span?: string }) {
  return (
    <article className={`cv2-card cv2-glass ${span} cv2-in`} style={inStyle(i)}>
      <div className="cv2-card-head"><div><h3>Последняя активность</h3></div></div>
      {items.length ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
          {items.map((a) => (
            <li key={a.lesson_id + a.completed_at} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)', fontSize: 14 }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: 'var(--ok)', marginRight: 6 }}>✓</span>{a.lesson?.title}</span>
              <span className="mono" style={{ color: 'var(--mut)', fontSize: 12, flexShrink: 0 }}>{whenAstana(a.completed_at, false).replace(/^\S+ /, '')}</span>
            </li>
          ))}
        </ul>
      ) : <p className="cv2-sub" style={{ marginTop: 10 }}>{t('activity_empty')}</p>}
    </article>
  );
}

/* ---------- код доступа (логика как в прежнем кабинете) ---------- */
export function CodeCard({ userId, t, compact = true, i = 0, span = 's4' }: { userId?: string; t: TFn; compact?: boolean; i?: number; span?: string }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const activate = async () => {
    if (!code.trim() || !userId) return;
    setBusy(true); setMsg(null);
    try {
      const { data: valid, error } = await supabase.rpc('validate_invite_code', { _code: code.trim() });
      if (error) throw error;
      if (!valid) { setMsg({ text: t('code_invalid'), ok: false }); return; }
      await supabase.rpc('use_invite_code', { _code: code.trim(), _user_id: userId });
      setMsg({ text: t('code_success'), ok: true });
      setCode('');
      window.setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMsg({ text: t('code_error'), ok: false });
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className={`cv2-card cv2-glass ${span} cv2-in`} style={inStyle(i)}>
      <div className="cv2-card-head"><div><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Ticket size={15} style={{ color: 'var(--brass)' }} />{t('code_label')}</h3>
        <div className="cv2-sub">{compact ? t('code_description_compact') : t('code_description_full')}</div></div></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <input className="cv2-input" id="cv2-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('code_placeholder')}
          onKeyDown={(e) => e.key === 'Enter' && activate()} aria-label={t('code_label')} />
        <button type="button" className="cv2-btn cv2-btn-brass" onClick={activate} disabled={busy || !code.trim()}>{busy ? '…' : t('code_submit')}</button>
      </div>
      {msg && <p style={{ margin: '8px 0 0', fontSize: 13, color: msg.ok ? 'var(--ok)' : 'var(--copper)' }}>{msg.text}</p>}
      <a href={DM} target="_blank" rel="noopener noreferrer" className="cv2-hint" style={{ display: 'inline-block', marginTop: 12 }}>{t('code_help_link')}</a>
    </article>
  );
}
