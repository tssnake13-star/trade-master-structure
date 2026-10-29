import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TerminalView from '@/components/terminal2/TerminalView';
import { BootScreen, NoAccess } from '@/components/terminal2/Screens';
import { useTerminalLive } from '@/components/terminal2/useTerminalLive';
import { useBootGate } from '@/components/terminal2/useBootGate';
import type { Section } from '@/components/terminal2/model';

/**
 * SchoolTerminal — ECHO-GATE INSIDE, под ним «Глаз системы» (/school/terminal).
 * Название — его, 21.09.2026. Внутри это терминал рынка.
 *
 * 29.10.2026, Сергей: «делай терминал в стиле приборов… полноценную страницу» — экран v2 (components/terminal2):
 * ночная комната кабинета, стекло, приборы сверху. Данные и их правила — прежние, они в useTerminalLive.ts:
 * экран ничего не считает, всё посчитало ядро на VPS; доступ, пробный режим и замки стоят в базе.
 * Превью без входа на демо-данных — /school/terminal-preview (terminal2/Preview.tsx), экран тот же.
 */
export default function SchoolTerminal() {
  const { session, user, role, loading: authLoading } = useAuth();
  // 23.09.2026, его слово: разделы администратора видит только администратор
  const isAdmin = role === 'admin';
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const live = useTerminalLive({ user, isAdmin, section });
  const { hold, scan } = useBootGate(!authLoading && !live.loading);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  if (authLoading || live.loading || hold) return <BootScreen steps={live.boot} />;

  const { rows, trial, until } = live.data;
  if (!rows.length && !trial) {
    // 07.10.2026: у кого пробный доступ закончился, видят «срок закончился», а не «не открыт»
    const expired = !!until && new Date(until).getTime() <= Date.now();
    return <NoAccess expired={expired} onCabinet={() => navigate('/school/dashboard')} onPrices={() => navigate('/#paths')} />;
  }

  return (
    <TerminalView
      data={live.data}
      source={live.source}
      isAdmin={isAdmin}
      seenKey={user?.id}
      scan={scan}
      onSection={setSection}
      onBack={() => navigate('/school/dashboard')}
    />
  );
}
