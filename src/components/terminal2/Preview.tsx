import { useMemo, useState } from 'react';
import { DemoOnly } from '@/lib/demoGate';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Verdict } from '@/components/terminal/Feeds';
import TerminalView from './TerminalView';
import { BootScreen, NoAccess } from './Screens';
import { useBootGate } from './useBootGate';
import { demoData, demoSource, demoVerdict, type DemoMode } from './fixture';

/**
 * Превью терминала v2 без входа — /school/terminal-preview (noindex у /school/* стоит в vercel.json).
 * Экран тот же, что у настоящего терминала (TerminalView), данные — демо из fixture.ts, подписаны на экране.
 * ?demo=trial — пробный доступ, ?demo=admin — с разделами администратора, ?demo=noaccess — экран без доступа.
 */
const MODES: [DemoMode | 'noaccess', string][] = [
  ['sub', 'подписчик'],
  ['trial', 'пробный доступ'],
  ['admin', 'администратор'],
  ['noaccess', 'без доступа'],
];

export default function TerminalPreview() {
  return <DemoOnly><TerminalPreviewPage /></DemoOnly>;
}

function TerminalPreviewPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = (MODES.find(([m]) => m === params.get('demo'))?.[0] || 'sub') as DemoMode | 'noaccess';
  const [now] = useState(() => Date.now());
  const [extra, setExtra] = useState<Verdict[]>([]);
  const data = useMemo(() => demoData(mode === 'noaccess' ? 'sub' : mode, now, extra), [mode, now, extra]);
  const { hold, scan } = useBootGate(true);

  if (hold) return <BootScreen steps={{ access: true, market: true, feeds: true }} />;
  if (mode === 'noaccess') return <NoAccess expired={false} onCabinet={() => setParams({ demo: 'sub' })} onPrices={() => navigate('/#paths')} />;

  const bar = (
    <div className="tv2-demo">
      <span className="cv2-chip brass">демо-данные</span>
      <span className="tv2-demo-t">
        Превью нового терминала без входа. Инструменты, решения журнала и их итоги здесь написаны вручную для показа, это
        не рынок и не мои решения. Блок «Мой счёт» в журнале настоящий, из таблицы счёта.
      </span>
      <span className="tv2-demo-modes" role="group" aria-label="Какой доступ показать">
        {MODES.map(([m, name]) => (
          <button key={m} type="button" aria-pressed={m === mode} onClick={() => setParams({ demo: m })}>
            {name}
          </button>
        ))}
      </span>
      {mode !== 'trial' ? (
        <button type="button" className="cv2-btn cv2-btn-ghost tv2-demo-send" onClick={() => setExtra((x) => [...x, demoVerdict(Date.now(), x.length)])}>
          Прислать решение (демо)
        </button>
      ) : null}
    </div>
  );

  return (
    <TerminalView
      data={data}
      source={demoSource}
      isAdmin={mode === 'admin'}
      seenKey="terminal-preview"
      scan={scan}
      demo
      demoBar={bar}
      onBack={() => navigate('/school/dashboard')}
    />
  );
}
