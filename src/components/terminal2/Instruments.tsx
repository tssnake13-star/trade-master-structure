import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Lock, Maximize2, X } from 'lucide-react';
import type { Verdict } from '@/components/terminal/Feeds';
import { marketOfSym } from '@/components/terminal/theme';
import { DayBars, DirStrip, Spark } from './Charts';
import { dirCells, fmtAst, fmtR, freshness, hhmmAst, msOf, plural as word, rSeries, rStats, scrStats, weekOf } from './derive';
import { DataDetail, DirDetail, RDetail, ScrDetail, WeekDetail } from './Details';
import type { Section, TerminalData } from './model';

/**
 * «Приборы» — полоса сверху терминала (29.10.2026, образец Сергея — ролик Moxen Instrumental: графитовые ячейки
 * с живыми цифрами; нажатие — ячейка вырастает в большое окно, остальное уходит в тень). Каждый прибор собран
 * только из того, что уже пришло из базы. Пробному доступу скринер не отдаётся — прибор стоит под замком,
 * цифр за него не рисуем.
 */

export type CellKey = 'week' | 'r' | 'dir' | 'scr' | 'data';
type Phase = 'idle' | 'mount' | 'open' | 'closing';

export interface StripProps {
  data: TerminalData;
  verdicts: Verdict[];
  now: number;
  demo?: boolean;
  /** сколько раз приходили новые решения, пока экран открыт — прибор решений вспыхивает */
  freshTick: number;
  onOpenSymbol: (sym: string) => void;
  onSection: (s: Section) => void;
  /** справа в строке над приборами (стиль торговли) */
  aside?: ReactNode;
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function InstrumentStrip({ data, verdicts: allVerdicts, now, demo, freshTick, onOpenSymbol, onSection, aside }: StripProps) {
  const { rows, feeds, meta, trial, hiddenVerdicts } = data;
  // 31.10.2026, его слово: «решение по крипте всю убрать надо из этих карточек. Оставить только Форекс»; крипта остаётся в журнале, на своей вкладке
  const verdicts = useMemo(() => allVerdicts.filter((v) => marketOfSym(v.instrument) === 'fx'), [allVerdicts]);
  const week = useMemo(() => weekOf(verdicts, now), [verdicts, now]);
  const points = useMemo(() => rSeries(verdicts, feeds.outcomes?.items), [verdicts, feeds.outcomes]);
  const rs = useMemo(() => rStats(points), [points]);
  const cells = useMemo(() => dirCells(rows), [rows]);
  const agree = cells.filter((c) => c.agree).length;
  const scr = useMemo(() => (trial ? null : scrStats(feeds.screener)), [trial, feeds.screener]);
  const fr = freshness(meta?.updated_at, now);

  // вспышка прибора решений, когда пришло новое решение (первый показ экрана — не вспышка)
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!freshTick) return;
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 2600);
    return () => window.clearTimeout(t);
  }, [freshTick]);

  /* ---- окно из прибора: FLIP, как openPanel/closePanel в прототипе кабинета ---- */
  const [openKey, setOpenKey] = useState<CellKey | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const from = useRef<HTMLElement | null>(null);
  const timer = useRef(0);
  const target = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    if (vw < 700) return { top: 10, left: 8, width: vw - 16, height: vh - 20 };
    const w = Math.min(1180, vw - 48), h = Math.min(640, vh - 96);
    return { top: Math.max(48, (vh - h) / 2), left: (vw - w) / 2, width: w, height: h };
  };
  const place = (el: HTMLElement, r: { top: number; left: number; width: number; height: number }) => {
    el.style.top = `${r.top}px`;
    el.style.left = `${r.left}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
  };
  const open = (k: CellKey, el: HTMLElement) => {
    window.clearTimeout(timer.current);
    from.current = el;
    setOpenKey(k);
    setPhase('mount');
  };
  useLayoutEffect(() => {
    if (phase !== 'mount') return;
    const p = panel.current, src = from.current;
    if (!p || !src) return;
    p.style.transition = 'none';
    place(p, src.getBoundingClientRect());
    void p.offsetWidth;
    p.style.transition = '';
    place(p, target());
    setPhase('open');
    timer.current = window.setTimeout(() => closeBtn.current?.focus({ preventScroll: true }), 420);
  }, [phase]);
  const close = useCallback(() => {
    const p = panel.current, src = from.current;
    if (!p) return;
    window.clearTimeout(timer.current);
    setPhase('closing');
    if (src) place(p, src.getBoundingClientRect());
    timer.current = window.setTimeout(() => {
      setOpenKey(null);
      setPhase('idle');
      src?.focus({ preventScroll: true });
    }, reduceMotion() ? 0 : 560);
  }, []);
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onResize = () => {
      if (panel.current) place(panel.current, target());
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [openKey, close]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // из окна — на вкладку или к инструменту: окно сначала уходит без анимации, иначе оно летело бы в прибор,
  // которого на новой вкладке уже не видно
  const leave = (fn: () => void) => {
    window.clearTimeout(timer.current);
    setOpenKey(null);
    setPhase('idle');
    fn();
  };
  const goSymbol = (sym: string) => leave(() => onOpenSymbol(sym));
  const goSection = (s: Section) => leave(() => onSection(s));

  const lastVerdict = verdicts.reduce((m, v) => Math.max(m, msOf(v.time) || 0), 0);

  const list: { key: CellKey; title: string; value: ReactNode; unit?: string; sub: ReactNode; viz: ReactNode; locked?: boolean; cls?: string }[] = [
    {
      key: 'week',
      title: 'Решения недели',
      value: week.ok + week.no,
      unit: word(week.ok + week.no, 'решение', 'решения', 'решений'),
      sub: (
        <>
          <span className="tv2-ok">допуск {week.ok}</span> · <span className="tv2-no">отказ {week.no}</span>
          {trial && hiddenVerdicts.length ? <> · ещё {hiddenVerdicts.length} через 3 дня</> : null}
        </>
      ),
      viz: <DayBars days={week.days} />,
      cls: flash ? 'fresh' : undefined,
    },
    {
      key: 'r',
      title: 'Итог решений в R',
      value: rs.trades ? fmtR(rs.total).replace(' R', '') : '—',
      unit: rs.trades ? 'R' : undefined,
      sub: rs.trades ? (
        <>
          {rs.trades} {word(rs.trades, 'сделка', 'сделки', 'сделок')} · тейки {fmtR(rs.plus)} · стопы {fmtR(-rs.minus)}
        </>
      ) : (
        'итогов пока нет'
      ),
      viz: <Spark values={[0, ...points.map((p) => p.cum)]} />,
    },
    {
      key: 'dir',
      title: 'Пары в направлении',
      value: rows.length ? agree : '—',
      unit: rows.length ? `из ${rows.length}` : undefined,
      sub: 'неделя и дневка смотрят в одну сторону',
      viz: <DirStrip cells={cells} />,
    },
    trial
      ? {
          key: 'scr',
          title: 'Скринер',
          value: <Lock size={22} strokeWidth={1.6} aria-label="под замком" />,
          sub: 'открывается в подписке',
          viz: <span className="tv2-cell-lockline" />,
          locked: true,
        }
      : {
          key: 'scr',
          title: 'Скринер',
          value: scr?.at ? hhmmAst(msOf(scr.at)) : '—',
          unit: scr?.at ? fmtAst(scr.at).slice(0, 5) : undefined,
          sub: scr ? (
            <>
              групп вверх {scr.up} · вниз {scr.down} · ТОП-лист {scr.top.length}
            </>
          ) : (
            'одобренного скринера пока нет'
          ),
          viz: scr ? (
            <span className="tv2-scr-viz" aria-hidden="true">
              {scr.groups.map((g) => (
                <i key={g.code} className={g.dir} title={g.name} />
              ))}
            </span>
          ) : null,
        },
    {
      key: 'data',
      title: 'Данные',
      value: meta?.updated_at ? hhmmAst(msOf(meta.updated_at)) : '—',
      unit: meta?.updated_at ? fmtAst(meta.updated_at).slice(0, 5) : undefined,
      sub: (
        <span className={`tv2-tone ${fr.tone}`}>
          <i className={fr.tone === 'ok' ? 'tv2-live' : 'tv2-live warn'} aria-hidden="true" />
          {fr.word}
        </span>
      ),
      viz: <span className="tv2-cell-foot">следующий расчёт {hhmmAst(fr.next)} по Астане</span>,
    },
  ];

  return (
    <section className="tv2-strip" aria-label="Приборы">
      <div className="tv2-strip-head">
        <span className="tv2-kicker">Приборы</span>
        <span className="tv2-hint">нажмите на прибор, он развернётся{demo ? ' · демо-данные' : ''}</span>
        {aside ? <span className="tv2-strip-aside">{aside}</span> : null}
      </div>
      <div className="tv2-cells">
        {list.map((c, i) => (
          <button
            key={c.key}
            type="button"
            className={`tv2-cell${c.locked ? ' locked' : ''}${c.cls ? ` ${c.cls}` : ''}${openKey === c.key ? ' src' : ''}`}
            style={{ '--i': i } as CSSProperties}
            aria-haspopup="dialog"
            aria-expanded={openKey === c.key}
            onClick={(e) => open(c.key, e.currentTarget)}
          >
            <span className="tv2-cell-h">
              <span className="tv2-cell-t">{c.title}</span>
              <Maximize2 size={12} aria-hidden="true" className="tv2-cell-x" />
            </span>
            <span className="tv2-cell-v">
              <b className="num">{c.value}</b>
              {c.unit ? <small>{c.unit}</small> : null}
            </span>
            <span className="tv2-cell-s">{c.sub}</span>
            <span className="tv2-cell-viz">{c.viz}</span>
          </button>
        ))}
      </div>

      {openKey ? (
        <>
          <div className={`tv2-scrim${phase === 'open' ? ' on' : ''}`} onClick={close} aria-hidden="true" />
          <div
            ref={panel}
            className={`cv2-panel tv2-xpanel${phase === 'open' ? ' open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tv2-xpanel-title"
          >
            <button ref={closeBtn} type="button" className="cv2-close" onClick={close} aria-label="Закрыть">
              <X size={16} />
            </button>
            <div className="cv2-panel-in">
              {openKey === 'week' && <WeekDetail verdicts={verdicts} now={now} trial={trial} hidden={hiddenVerdicts.length} onOpenSymbol={goSymbol} onJournal={() => goSection('verdicts')} />}
              {openKey === 'r' && <RDetail points={points} now={now} />}
              {openKey === 'dir' && <DirDetail cells={cells} onOpenSymbol={goSymbol} />}
              {openKey === 'scr' && <ScrDetail stats={scr} trial={trial} onOpenSymbol={goSymbol} onSection={goSection} />}
              {openKey === 'data' && <DataDetail data={data} now={now} lastVerdict={lastVerdict || null} demo={demo} scrAt={scr?.at || null} />}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

