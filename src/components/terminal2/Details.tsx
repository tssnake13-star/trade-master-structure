import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import type { Verdict } from '@/components/terminal/Feeds';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { fmtDate } from '@/components/terminal/theme';
import DropGroup from '@/components/cabinet2/DropGroup';
import { DayBars, RChart } from './Charts';
import {
  ddmm, fmtAst, fmtNum, fmtR, freshness, hhmmAst, msOf, plural, rStats, rWindow, weekOf, weeksOf,
  type DirCell, type RPoint, type ScrStats,
} from './derive';
import type { Section, TerminalData } from './model';

/** Содержимое окон, которые разворачиваются из приборов. Всё из тех же данных, что и сами приборы. */

function Head({ title, sub, right }: { title: string; sub: ReactNode; right?: ReactNode }) {
  return (
    <div className="tv2-x-head">
      <div>
        <h2 id="tv2-xpanel-title">{title}</h2>
        <div className="tv2-x-sub">{sub}</div>
      </div>
      {right ? <div className="tv2-x-right">{right}</div> : null}
    </div>
  );
}

const Pill = ({ v }: { v: Verdict['verdict'] }) => <span className={`cv2-pill ${v === 'ДОПУСК' ? 'ok' : 'no'}`}>{v === 'ДОПУСК' ? 'Допуск' : 'Отказ'}</span>;
const arrow = (s: string | null) => (s === 'LONG' ? '↑' : s === 'SHORT' ? '↓' : '~');

/* ---------------- решения недели ---------------- */
type Per = 'w' | '4' | '12';
export function WeekDetail({ verdicts, now, trial, hidden, onOpenSymbol, onJournal }: { verdicts: Verdict[]; now: number; trial: boolean; hidden: number; onOpenSymbol: (s: string) => void; onJournal: () => void }) {
  const [per, setPer] = useState<Per>('w');
  const [pick, setPick] = useState<string | null>(null);
  const bars = useMemo(() => (per === 'w' ? weekOf(verdicts, now).days : weeksOf(verdicts, now, per === '4' ? 4 : 12)), [per, verdicts, now]);
  const sel = pick ? bars.find((b) => b.day === pick) || null : null;
  const items = (sel ? sel.items : bars.flatMap((b) => b.items)).slice().sort((a, b) => b.time.localeCompare(a.time));
  const ok = bars.reduce((s, b) => s + b.ok, 0), no = bars.reduce((s, b) => s + b.no, 0);
  const total = ok + no;
  return (
    <>
      <Head
        title="Решения недели"
        sub={<>мои допуски и отказы · по Астане{trial ? ' · в пробном доступе с задержкой 3 дня' : ''}</>}
        right={
          <DropGroup<Per>
            variant="sm"
            label="Период"
            value={per}
            onChange={(k) => { setPer(k); setPick(null); }}
            items={[{ key: 'w', label: 'неделя' }, { key: '4', label: '4 недели' }, { key: '12', label: '12 недель' }]}
          />
        }
      />
      <div className="tv2-x-grid">
        <div className="tv2-x-side">
          <div className="tv2-x-big num">{total}</div>
          <div className="tv2-x-cap">{plural(total, 'решение', 'решения', 'решений')}{per === 'w' ? ' на этой неделе' : per === '4' ? ' за 4 недели' : ' за 12 недель'}</div>
          <dl className="tv2-kv">
            <dt>Допуск</dt>
            <dd className="tv2-ok">{ok}</dd>
            <dt>Отказ</dt>
            <dd className="tv2-no">{no}</dd>
            {trial && hidden ? (
              <>
                <dt>Ещё скрыто</dt>
                <dd>{hidden}</dd>
              </>
            ) : null}
          </dl>
          <p className="tv2-x-note">
            {trial
              ? `Решения за последние 3 дня в пробном доступе открываются через 3 дня после публикации, у подписчиков приходят сразу.`
              : 'Пока открыт журнал решений, новое решение приходит сюда через 2–3 секунды после моей кнопки в боте.'}
          </p>
          <button type="button" className="cv2-btn cv2-btn-ghost tv2-x-go" onClick={onJournal}>
            Журнал решений <ArrowRight size={15} />
          </button>
        </div>
        <div className="tv2-x-main">
          <DayBars days={bars} big active={pick} onPick={(d) => setPick((p) => (p === d ? null : d))} />
          <div className="tv2-x-listhead">
            <span>{sel ? `${per === 'w' ? sel.label + ', ' + ddmm(sel.day) : 'неделя с ' + ddmm(sel.day)}` : 'все решения периода'}</span>
            {sel ? (
              <button type="button" className="tv2-link" onClick={() => setPick(null)}>
                показать все
              </button>
            ) : (
              <span className="tv2-hint">нажмите на столбик — останутся его решения</span>
            )}
          </div>
          {items.length ? (
            <ul className="tv2-vlist">
              {items.slice(0, 60).map((v, i) => (
                <li key={`${v.time}-${v.instrument}-${i}`} className="tv2-vrow">
                  <time className="num">{v.no_time ? ddmm(v.time.slice(0, 10)) : fmtAst(v.time)}</time>
                  <button type="button" className="tv2-sym" onClick={() => onOpenSymbol(v.instrument)}>
                    {v.instrument}
                  </button>
                  <span className="tv2-dirw">{v.side} {arrow(v.side)}</span>
                  <Pill v={v.verdict} />
                  <span className="tv2-why">{v.reason || (v.scenario && v.scenario !== 'итог' ? `сценарий ${v.scenario}` : '')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="tv2-empty">За этот период решений нет.</div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- итог решений в R ---------------- */
type RPer = 'm' | 'q' | 'all';
export function RDetail({ points, now }: { points: RPoint[]; now: number }) {
  const [per, setPer] = useState<RPer>('all');
  const pts = useMemo(() => rWindow(points, now, per === 'm' ? 30 : per === 'q' ? 91 : null), [points, now, per]);
  const st = rStats(pts);
  const decided = st.wins + st.losses;
  const be = st.trades - decided;
  const from = pts[0]?.time;
  return (
    <>
      <Head
        title="Итог решений в R"
        sub={<>сделки по моим решениям, итог из субботнего разбора недели{from ? ` · с ${fmtAst(from, true).slice(0, 10)}` : ''}</>}
        right={
          <DropGroup<RPer>
            variant="sm"
            label="Период"
            value={per}
            onChange={setPer}
            items={[{ key: 'm', label: 'месяц' }, { key: 'q', label: '3 месяца' }, { key: 'all', label: 'всё' }]}
          />
        }
      />
      <div className="tv2-x-grid">
        <div className="tv2-x-side">
          <div className="tv2-x-big num">{st.trades ? fmtR(st.total) : '—'}</div>
          <div className="tv2-x-cap">
            {st.trades ? `${st.total >= 0 ? '+' : '−'}${fmtNum(Math.abs(st.total) * 0.25, 2)}% к депозиту при риске 0,25% на сделку` : 'итогов за этот период нет'}
          </div>
          {st.trades ? (
            <dl className="tv2-kv">
              <dt>Сделок</dt>
              <dd>{st.trades}</dd>
              <dt>Тейки</dt>
              <dd>{fmtR(st.plus)} · {st.wins}</dd>
              <dt>Стопы</dt>
              <dd>{fmtR(-st.minus)} · {st.losses}</dd>
              {be ? (
                <>
                  <dt>Безубыток</dt>
                  <dd>{be}</dd>
                </>
              ) : null}
              {decided ? (
                <>
                  <dt>Прибыльных</dt>
                  {/* винрейт — только рядом с размером тейка и стопа: без них 1 из 4 читается как провал */}
                  <dd>
                    {Math.round((st.wins / decided) * 100)}% ({st.wins} из {decided})
                  </dd>
                  <dt>Средний тейк / стоп</dt>
                  <dd>
                    {st.wins ? fmtR(st.avgWin) : '—'} / {st.losses ? fmtR(-st.avgLoss) : '—'}
                  </dd>
                </>
              ) : null}
            </dl>
          ) : null}
          <p className="tv2-x-note">1 R — это один стоп. Прошлый результат не гарантирует будущий.</p>
        </div>
        <div className="tv2-x-main">
          <RChart points={pts} height={300} />
          <div className="tv2-hint">наведите на линию — дата, инструмент, сделка и итог на этот момент</div>
          {pts.length ? (
            <>
              <div className="tv2-x-listhead">
                <span>сделки периода, свежие сверху</span>
                <span className="num">{pts.length}</span>
              </div>
              <ul className="tv2-vlist">
                {pts.slice().reverse().slice(0, 40).map((p, i) => (
                  <li key={`${p.time}-${p.instrument}-${i}`} className="tv2-vrow tv2-rrow">
                    <time className="num">{fmtAst(p.time)}</time>
                    <span className="tv2-sym-t num">{p.instrument}</span>
                    <span className="tv2-dirw">{p.side} {arrow(p.side)}</span>
                    <b className="num">{fmtR(p.r)}</b>
                    <span className="tv2-why">{p.result}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ---------------- пары в направлении ---------------- */
export function DirDetail({ cells, onOpenSymbol }: { cells: DirCell[]; onOpenSymbol: (s: string) => void }) {
  const groups: [string, string, DirCell[]][] = [
    ['up', 'неделя и дневка вверх', cells.filter((c) => c.agree === 'LONG')],
    ['dn', 'неделя и дневка вниз', cells.filter((c) => c.agree === 'SHORT')],
    ['split', 'неделя и дневка расходятся', cells.filter((c) => !c.agree && c.w && c.d)],
    ['one', 'направление только у одного таймфрейма или нет', cells.filter((c) => !c.agree && !(c.w && c.d))],
  ];
  const word = (d: string | null) => (d === 'LONG' ? 'вверх' : d === 'SHORT' ? 'вниз' : 'нет направления');
  return (
    <>
      <Head title="Пары в направлении" sub="итог критериев недели и дневки — те же стрелки, что в списке инструментов" />
      <div className="tv2-x-big num" style={{ marginTop: 4 }}>
        {cells.filter((c) => c.agree).length} <small>из {cells.length}</small>
      </div>
      <div className="tv2-x-cap">инструментов, где неделя и дневка смотрят в одну сторону</div>
      <div className="tv2-dir-groups">
        {groups.map(([k, name, list]) =>
          list.length ? (
            <div key={k} className="tv2-dir-group">
              <div className="tv2-x-listhead">
                <span>{name}</span>
                <span className="num">{list.length}</span>
              </div>
              <div className="tv2-tiles">
                {list.map((c) => (
                  <button
                    key={c.r.symbol}
                    type="button"
                    className={`tv2-tile ${k}`}
                    title={`неделя: ${word(c.w)} · дневка: ${word(c.d)} — открыть инструмент`}
                    onClick={() => onOpenSymbol(c.r.symbol)}
                  >
                    <b>{c.r.symbol}</b>
                    <span className="num">
                      Н{arrow(c.w)} Д{arrow(c.d)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </>
  );
}

/* ---------------- скринер ---------------- */
export function ScrDetail({ stats, trial, onOpenSymbol, onSection }: { stats: ScrStats | null; trial: boolean; onOpenSymbol: (s: string) => void; onSection: (s: Section) => void }) {
  if (trial) {
    return (
      <>
        <Head title="Скринер" sub="открывается в подписке" />
        <div className="tv2-lock">
          <Lock size={22} />
          <p>
            Скринер показывает, куда смотреть на этой неделе: группы, их направление и ТОП-лист. Он работает у подписчиков
            и приходит сразу, как я его одобрю.
          </p>
          <a className="cv2-btn cv2-btn-brass" href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer">
            Открыть всё: написать Сергею
          </a>
        </div>
      </>
    );
  }
  if (!stats) {
    return (
      <>
        <Head title="Скринер" sub="одобренного скринера пока нет" />
        <div className="tv2-empty">Скринер появится здесь сразу, как я его одобрю.</div>
      </>
    );
  }
  const dirName = { up: '↑ вверх · BUY', down: '↓ вниз · SELL', flat: '~ без чёткого направления' } as const;
  return (
    <>
      <Head
        title="Скринер"
        sub={<>от {fmtAst(stats.at)} по Астане · одобрен автором · то же, что получили подписчики</>}
        right={
          <div className="tv2-x-btns">
            <button type="button" className="cv2-btn cv2-btn-ghost" onClick={() => onSection('screener')}>
              Скринер <ArrowRight size={15} />
            </button>
            <button type="button" className="cv2-btn cv2-btn-ghost" onClick={() => onSection('top')}>
              ТОП-лист <ArrowRight size={15} />
            </button>
          </div>
        }
      />
      <div className="tv2-x-grid half">
        <div className="tv2-x-main tv2-scr-groups">
          {(['up', 'down', 'flat'] as const).map((d) => {
            const gs = stats.groups.filter((g) => g.dir === d);
            return gs.length ? (
              <div key={d} className="tv2-dir-group">
                <div className="tv2-x-listhead">
                  <span>{dirName[d]}</span>
                  <span className="num">{gs.length}</span>
                </div>
                {gs.map((g) => (
                  <div key={g.code} className="tv2-scr-row">
                    <b>{g.name}</b>
                    <span className="tv2-scr-ins">
                      {g.instruments.length
                        ? g.instruments.map((x) => (
                            <button key={x.symbol} type="button" className="tv2-sym" onClick={() => onOpenSymbol(x.symbol)}>
                              {x.symbol} {arrow(x.side)}
                            </button>
                          ))
                        : <span className="tv2-hint">инструментов в работе нет</span>}
                    </span>
                  </div>
                ))}
              </div>
            ) : null;
          })}
        </div>
        <div className="tv2-x-side">
          <div className="tv2-x-listhead">
            <span>ТОП-лист</span>
            <span className="num">{stats.top.length}</span>
          </div>
          {stats.top.length ? (
            <ol className="tv2-top">
              {stats.top.map((t) => (
                <li key={t.rank}>
                  <span className="num">{t.rank}</span>
                  <button type="button" className="tv2-sym" onClick={() => onOpenSymbol(t.symbol)}>
                    {t.symbol}
                  </button>
                  <span className="tv2-dirw">
                    {t.side} {arrow(t.side)}
                  </span>
                  <span className="tv2-why">
                    {t.scenario ? `сценарий ${t.scenario}` : ''}
                    {t.day.passed != null ? ` · дневка пройдена на ${t.day.passed}%` : ''}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="tv2-empty">В этом скринере ТОП-лист пуст.</div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- данные ---------------- */
export function DataDetail({ data, now, lastVerdict, scrAt, demo }: { data: TerminalData; now: number; lastVerdict: number | null; scrAt: string | null; demo?: boolean }) {
  const fr = freshness(data.meta?.updated_at, now);
  const rowsKV: [string, ReactNode][] = [
    ['Расчёт рынка', <>{fmtAst(data.meta?.updated_at, true)} · <span className={`tv2-tone ${fr.tone}`}>{fr.word}</span></>],
    ['Следующий расчёт', `${hhmmAst(fr.next)}, через час после новой дневной свечи`],
    ['Свечи закрыты по', data.meta?.bars_at ? fmtAst(data.meta.bars_at, true).slice(0, 10) : '—'],
    ['Скринер', data.trial ? 'в подписке' : scrAt ? fmtAst(scrAt, true) : '—'],
    ['Последнее решение', lastVerdict ? fmtAst(lastVerdict, true) : '—'],
    ['Журнал решений', data.feedAt.verdicts ? `обновлён ${fmtAst(data.feedAt.verdicts, true)}` : '—'],
    ['Итоги разбора', data.feedAt.outcomes ? `обновлены ${fmtAst(data.feedAt.outcomes, true)}` : '—'],
    ...(data.until ? ([[data.trial ? 'Пробный доступ до' : 'Подписка до', fmtDate(data.until)]] as [string, ReactNode][]) : []),
  ];
  return (
    <>
      <Head title="Данные" sub={demo ? 'демо-данные · время по Астане' : 'что когда обновилось · время по Астане'} />
      <dl className="tv2-kv tv2-kv-wide">
        {rowsKV.map(([k, v]) => (
          <div key={k} className="tv2-kv-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="tv2-x-note">
        Данные с сервера бота обновляются сами раз в сутки, в 03:05 по Астане, через час после новой дневной свечи.
        Скринер и журнал решений приходят сразу, как я их отправлю: пока открыта их вкладка, терминал проверяет
        их каждые 3 секунды. Цены в списке инструментов стоят на время расчёта и между расчётами не меняются.
      </p>
    </>
  );
}
