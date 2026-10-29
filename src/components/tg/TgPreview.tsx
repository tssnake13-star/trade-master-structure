import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DemoOnly } from '@/lib/demoGate';
import TgView from './TgView';
import { tgDemo, type TgDemoMode } from './tgFixture';
import type { Bot } from './tgCommon';

/**
 * Превью терминала в Телеграме без Телеграма — /school/tg-preview/echo и /school/tg-preview/school (noindex у /school/*
 * стоит в vercel.json; на рабочем домене DemoOnly ведёт на /school). Экран тот же, что у настоящего (TgView), данные —
 * демо из tgFixture.ts, подписаны на экране. ?demo= — какой доступ показать, ?tab= — с какой вкладки открыть.
 */
const MODES: Record<Bot, [TgDemoMode, string][]> = {
  echo: [
    ['full', 'подписчик'],
    ['noaccess', 'без подписки'],
  ],
  school: [
    ['full', '7 дней пробы'],
    ['limited', 'после пробы'],
    ['quiz', 'до 4 вопросов'],
    ['noaccess', 'проба закончилась'],
  ],
};
const BOTS: [Bot, string][] = [
  ['school', 'школьный бот'],
  ['echo', 'бот экосистемы'],
];

/** Картинка бота в демо — заглушка с подписью, а не рисунок рынка */
const demoPic = (p: string) => {
  const [sym, kind] = p.split('|');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#0b111e"/>` +
    `<g stroke="#1c2536">${Array.from({ length: 9 }, (_, i) => `<line x1="0" x2="800" y1="${50 * (i + 1)}" y2="${50 * (i + 1)}"/>`).join('')}</g>` +
    `<text x="400" y="235" fill="#cdaa6e" font-family="sans-serif" font-size="30" text-anchor="middle">демо: здесь картинка бота</text>` +
    `<text x="400" y="280" fill="#94a1b8" font-family="monospace" font-size="22" text-anchor="middle">${sym} · ${kind}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
const demoScene = () => '';

function TgPreviewPage() {
  const bot: Bot = useParams().bot === 'echo' ? 'echo' : 'school';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = (MODES[bot].find(([m]) => m === params.get('demo'))?.[0] || 'full') as TgDemoMode;
  const [now] = useState(() => Date.now());
  const { d, fresh } = useMemo(() => tgDemo(bot, mode, now), [bot, mode, now]);
  // как у настоящего: после запуска скан открывает окно сверху вниз
  const [scan, setScan] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!scan) return;
    const t = window.setTimeout(() => setScan(false), 1600);
    return () => window.clearTimeout(t);
  }, [scan]);

  const goTo = (b: Bot, m: TgDemoMode) => navigate(`/school/tg-preview/${b}?demo=${m}`);
  const bar = (
    <div className="tv2-demo tg-demo">
      <span className="cv2-chip brass">демо-данные</span>
      <span className="tv2-demo-t">
        Превью терминала в Телеграме без Телеграма. Инструменты, решения журнала, их итоги, картинки бота и свечи «Сделок до и
        после» здесь написаны вручную для показа, это не рынок и не мои решения. Блок «Мой счёт» в журнале настоящий, из таблицы счёта.
      </span>
      <span className="tv2-demo-modes" role="group" aria-label="Какой бот показать">
        {BOTS.map(([b, name]) => (
          <button key={b} type="button" aria-pressed={b === bot} onClick={() => goTo(b, 'full')}>
            {name}
          </button>
        ))}
      </span>
      <span className="tv2-demo-modes" role="group" aria-label="Какой доступ показать">
        {MODES[bot].map(([m, name]) => (
          <button key={m} type="button" aria-pressed={m === mode} onClick={() => goTo(bot, m)}>
            {name}
          </button>
        ))}
      </span>
    </div>
  );
  return <TgView key={`${bot}-${mode}`} bot={bot} d={d} fresh={fresh} scan={scan} pubUrl={demoPic} sceneUrl={demoScene} demoBar={bar} />;
}

export default function TgPreview() {
  return (
    <DemoOnly>
      <TgPreviewPage />
    </DemoOnly>
  );
}
