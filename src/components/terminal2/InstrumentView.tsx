import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import DropGroup from '@/components/cabinet2/DropGroup';
import { ALPHA_TIP, CycleCard, Lines, type MarketRow } from '@/components/terminal/parts';
import { Decision } from '@/components/terminal/Decision';
import { HistoryOf } from '@/components/terminal/History';
import LiveChart from '@/components/terminal/LiveChart';
import { LAYERS, layersOf, type Layer, type Scene } from '@/components/terminal/scene';
import { GEN } from '@/components/terminal/screenerParse';
import { BLUE, UP, fmtDate } from '@/components/terminal/theme';
import type { FeedDocs } from '@/components/terminal/Feeds';
import { KINDS, TABS, noScenReason, type Kind, type Tab, type TerminalSource } from './model';

/**
 * Вкладка «Инструмент»: шапка инструмента с главным блоком (Decision), график (живой или картинка как в боте)
 * и правая панель вкладок (Анализ, Циклы, Накопления, Рейндж, Как в боте, у администратора История).
 * Логика — та же, что была в SchoolTerminal.tsx; поменялся облик: стекло, латунь, «капля» на переключателях.
 */

export function useInstrumentMedia(cur: MarketRow | null, kind: Kind, live: boolean, updatedAt: string | null | undefined, source: TerminalSource) {
  const [pic, setPic] = useState<string | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  // Картинки лежат в закрытом ящике: ссылка живёт час и только для вошедшего
  useEffect(() => {
    let alive = true;
    const path = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    setPic(null);
    if (!path) return;
    source.chartUrl(path).then((u) => {
      if (alive) setPic(u);
    });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, updatedAt, source]);
  // Данные живого графика: только если есть сама картинка этого вида — иначе сценария нет, и живому графику
  // показывать нечего (как и в боте)
  useEffect(() => {
    let alive = true;
    setScene(null);
    const has = kind === 'cycles' ? cur?.chart_cycles : kind === 'trend' ? cur?.chart_trend : cur?.chart_all;
    const sym = cur?.symbol;
    if (!sym || !has || !live) return;
    source.scene(sym, kind).then((s) => {
      if (alive) setScene(s);
    });
    return () => {
      alive = false;
    };
  }, [cur?.symbol, cur?.chart_cycles, cur?.chart_trend, cur?.chart_all, kind, live, updatedAt, source]);
  return { pic, scene };
}

export interface ChartView {
  kind: Kind;
  setKind: (k: Kind) => void;
  live: boolean;
  setLive: (v: boolean) => void;
  hidden: Set<Layer>;
  setHidden: (f: (h: Set<Layer>) => Set<Layer>) => void;
  showLayers: boolean;
  setShowLayers: (v: boolean) => void;
}

export function InstrumentMain({
  cur, phone, view, pic, scene, onZoom, demo,
}: {
  cur: MarketRow; phone: boolean; view: ChartView; pic: string | null; scene: Scene | null; onZoom: () => void; demo?: boolean;
}) {
  const { kind, setKind, live, setLive, hidden, setHidden, showLayers, setShowLayers } = view;
  const present = useMemo(() => layersOf(scene), [scene]);
  return (
    <>
      <div className="tv2-panel tv2-ins-head tv2-in" style={{ '--i': 0 } as CSSProperties}>
        <div className="tv2-ins-title">
          <h1 className="num">{cur.symbol}</h1>
          <span className="tv2-ins-name">{cur.title}</span>
          {cur.extra?.leads ? (
            <span className="tv2-chip" title={cur.extra.leads === 'DXY' ? ALPHA_TIP : undefined}>
              {`поводырь группы ${GEN[cur.extra.leads] || cur.extra.leads}`}
            </span>
          ) : null}
          <span className="tv2-ins-price num" title="цена на время расчёта">{cur.price_text || '—'}</span>
        </div>
        {/* 21.09.2026, его слово: направление, сценарий, подтверждение, поводырь и критерии недели и дневки —
            самое главное об инструменте: крупно, по центру, одним блоком */}
        <Decision r={cur} narrow={phone} />
      </div>

      <div className="tv2-panel tv2-chart-panel tv2-in" style={{ '--i': 1 } as CSSProperties}>
        <div className="tv2-chart-bar">
          <DropGroup variant="sm" label="Вид графика" value={kind} onChange={setKind} items={KINDS.map(([k, name]) => ({ key: k, label: name }))} />
          <span className="tv2-hint">{KINDS.find(([k]) => k === kind)?.[2]}</span>
        </div>
        <div className="tv2-chart-bar">
          <DropGroup
            variant="sm"
            label="Живой график или картинка"
            value={live ? 'live' : 'pic'}
            onChange={(v) => setLive(v === 'live')}
            items={[{ key: 'live', label: 'живой график' }, { key: 'pic', label: 'картинка как в боте' }]}
          />
          {live && scene && phone ? (
            <button type="button" className={showLayers ? 'tv2-chip on' : 'tv2-chip'} onClick={() => setShowLayers(!showLayers)} aria-expanded={showLayers}>
              слои {showLayers ? '▴' : '▾'}
            </button>
          ) : null}
          {live && scene && (showLayers || !phone)
            ? LAYERS.filter(([L]) => present.has(L)).map(([L, name]) => (
                <button
                  key={L}
                  type="button"
                  aria-pressed={!hidden.has(L)}
                  className={hidden.has(L) ? 'tv2-chip off' : 'tv2-chip'}
                  onClick={() =>
                    setHidden((h) => {
                      const n = new Set(h);
                      if (n.has(L)) n.delete(L);
                      else n.add(L);
                      return n;
                    })
                  }
                >
                  {name}
                </button>
              ))
            : null}
        </div>
        {live && scene ? (
          <LiveChart scene={scene} hidden={hidden} noHead />
        ) : pic ? (
          <img src={pic} alt={`${cur.symbol} ${KINDS.find(([k]) => k === kind)?.[1]}`} onClick={onZoom} className="tv2-chart-img" />
        ) : (
          <div className="tv2-empty tv2-chart-empty">
            {/* 21.09.2026, его вопрос по USDCNH: «нет графика или нет CSV?» — говорим прямо, что из двух */}
            {demo
              ? 'В демо-режиме графика нет: в терминале здесь живой график и картинка как в боте.'
              : !cur.bars_at
                ? 'Свечей нет: ни CSV из терминала, ни символа в MT5 сервера — посчитать нечего.'
                : kind === 'cycles' && !cur.scenario
                  ? `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}. ${noScenReason(cur)} Картинку сценария бот рисует, только когда сценарий есть. Накопления и все циклы — на соседних вкладках.`
                  : `Данные есть — свечи закрыты по ${fmtDate(cur.bars_at)}, но картинка при последнем обновлении не построилась. Появится со следующим обновлением.`}
          </div>
        )}
      </div>
    </>
  );
}

export function InstrumentRight({ cur, isAdmin, history, tab, setTab }: { cur: MarketRow; isAdmin: boolean; history?: FeedDocs['history']; tab: Tab; setTab: (t: Tab) => void }) {
  const tabs = TABS.filter((t) => t !== 'История' || isAdmin);
  // знаков после точки — как у цены инструмента (у золота 2, у евро 5)
  const dg = cur.price_text?.includes('.') ? cur.price_text.split('.')[1].length : 4;
  // 21.09.2026, его просьба по макету: цикл со столбиком «пройдено» — неделя синим, дневка зелёным
  const cycles: ReactNode = (
    <>
      <CycleCard title="цикл недели" c={cur.cycle_w1} color={BLUE} dg={dg} />
      <CycleCard title="цикл дневки" c={cur.cycle_d1} color={UP} dg={dg} />
    </>
  );
  return (
    <div className="tv2-panel tv2-right tv2-in" style={{ '--i': 2 } as CSSProperties}>
      <div className="tv2-right-tabs">
        <DropGroup variant="sm" label="Разделы инструмента" value={tab} onChange={setTab} items={tabs.map((t) => ({ key: t, label: t }))} />
      </div>
      {tab === 'Анализ' && (
        <div>
          {/* 21.09.2026, его слово: инструмент, сценарий, неделя и дневка здесь повторяли верхний блок —
              «лишняя информация»; главное теперь только наверху */}
          <div className="tv2-kv-row tv2-kv-line">
            <dt>свечи закрыты по</dt>
            <dd className="num">{fmtDate(cur.bars_at)}</dd>
          </div>
          <div className="tv2-kicker" style={{ marginTop: 14 }}>накопления</div>
          <div className="tv2-text">
            неделя: {cur.trend_w1 || '—'}
            <br />
            дневка: {cur.trend_d1 || '—'}
            <br />
            {cur.trend_total ? <span className="tv2-brass">{cur.trend_total}</span> : null}
          </div>
          <div style={{ marginTop: 14 }}>{cycles}</div>
        </div>
      )}
      {tab === 'Циклы' && <div>{cycles}</div>}
      {tab === 'Накопления' && <Lines lines={cur.trend_lines} />}
      {tab === 'Рейндж' && <Lines lines={cur.range_lines} />}
      {tab === 'Как в боте' && <Lines lines={cur.card_lines} />}
      {tab === 'История' && isAdmin && <HistoryOf doc={history} symbol={cur.symbol} />}
    </div>
  );
}
