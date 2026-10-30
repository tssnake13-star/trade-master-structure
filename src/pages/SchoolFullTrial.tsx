import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { clearWebTrial, pendingWebTrial, saveWebTrial } from '@/lib/webTrial';
import '@/styles/cabinet-v2.css';
import Room from '@/components/cabinet2/Room';

/**
 * /school/full?t=… — кнопка «Полная версия на компьютере» в школьном боте (30.10.2026, его «да, делай»).
 * Не вошёл — на регистрацию (ссылка ждёт в браузере, после входа кабинет вернёт сюда). Вошёл — база проверяет подпись
 * и открывает пробу до того же дня, что в боте, и сразу терминал. Один человек в боте — один аккаунт.
 */
type Reason = 'bad' | 'expired' | 'used' | 'net';

const TEXT: Record<Reason, { title: string; body: string }> = {
  expired: {
    title: 'Пробные 7 дней закончились',
    body: 'Срок пробы в боте прошёл, поэтому ссылка больше не открывает терминал. Журнал моих решений по-прежнему открыт в боте.',
  },
  used: {
    title: 'Ссылка уже открыла терминал',
    body: 'По этой ссылке терминал открыт на другом аккаунте. Войдите в тот аккаунт, на который регистрировались по ней.',
  },
  bad: {
    title: 'Ссылка не подходит',
    body: 'Откройте её заново кнопкой «Полная версия на компьютере» в боте.',
  },
  net: {
    title: 'Не получилось открыть терминал',
    body: 'Сервер не ответил. Откройте ссылку из бота ещё раз.',
  },
};

export default function SchoolFullTrial() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [fail, setFail] = useState<Reason | null>(null);

  useEffect(() => {
    const fromLink = params.get('t');
    if (fromLink) saveWebTrial(fromLink);
    if (loading) return;
    const t = fromLink || pendingWebTrial();
    if (!t) {
      navigate('/school/dashboard', { replace: true });
      return;
    }
    if (!session) {
      navigate('/school?signup=1', { replace: true });
      return;
    }
    let alive = true;
    (supabase.rpc as unknown as (f: string, a: object) => Promise<{ data: { ok?: boolean; reason?: string } | null; error: unknown }>)(
      'claim_web_trial',
      { t },
    ).then(({ data, error }) => {
      if (!alive) return;
      if (error || !data) {
        clearWebTrial();
        setFail('net');
        return;
      }
      if (data.reason === 'auth') {
        navigate('/school', { replace: true });
        return;
      }
      clearWebTrial();
      if (data.ok) navigate('/school/terminal', { replace: true });
      else setFail(data.reason === 'expired' || data.reason === 'used' ? data.reason : 'bad');
    });
    return () => {
      alive = false;
    };
  }, [params, session, loading, navigate]);

  return (
    <div className="cv2 min-h-screen flex items-center justify-center px-4">
      <Room />
      <div className="w-full max-w-md cv2-glass cv2-in text-center" style={{ padding: 28 }}>
        {fail ? (
          <>
            <h1 className="cv2-h1 mb-4">{TEXT[fail].title}</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#C6D0E0' }}>{TEXT[fail].body}</p>
            <div className="mt-6 flex flex-col gap-3">
              {fail !== 'net' && (
                <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" className="cv2-btn cv2-btn-brass w-full" style={{ padding: '13px 16px', fontSize: 15 }}>
                  Открыть бота
                </a>
              )}
              <Link to="/school/dashboard" className="cv2-btn cv2-btn-ghost w-full" style={{ padding: '13px 16px', fontSize: 15 }}>
                В кабинет
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: '#C6D0E0' }}>Открываю терминал…</p>
        )}
      </div>
    </div>
  );
}
