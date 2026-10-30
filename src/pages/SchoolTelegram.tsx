import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { clearLinkPending } from '@/lib/webTrial';
import '@/styles/cabinet-v2.css';
import Room from '@/components/cabinet2/Room';

/**
 * /school/telegram — шаг после регистрации (30.10.2026, его слова: «на сайте надо, чтобы они оставляли свой телеграм…
 * почта как резерв, нужен именно Telegram»). Ник в форме не годится: его пишут с ошибкой, а бот не может написать первым.
 * Поэтому кнопка открывает школьного бота с одноразовым кодом, бот связывает аккаунт и задаёт 4 вопроса. Прошёл — база
 * открывает пробу и здесь, страница сама переходит в терминал. Без Telegram терминала нет, вводный курс остаётся.
 */
const BOT = 'https://t.me/New_TradeLikeTYO_bot';
const db = supabase as unknown as SupabaseClient;

export default function SchoolTelegram() {
  const navigate = useNavigate();
  const { session, user, loading } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate('/school', { replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    db.rpc('make_tg_link_code').then(({ data }) => setCode((data as string | null) || null));
  }, [user]);

  // человек отвечает боту в другом окне: смотрим, подключён ли Telegram и открылся ли терминал
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const tick = async () => {
      const [lead, access] = await Promise.all([
        db.from('site_leads').select('tg_id').eq('user_id', user.id).maybeSingle(),
        db.from('terminal_access').select('expires_at').eq('user_id', user.id).maybeSingle(),
      ]);
      if (!alive) return;
      setLinked(!!(lead.data as { tg_id?: number | null } | null)?.tg_id);
      const until = (access.data as { expires_at?: string } | null)?.expires_at;
      if (until && new Date(until).getTime() > Date.now()) {
        clearLinkPending();
        navigate('/school/terminal', { replace: true });
      }
    };
    tick();
    const t = window.setInterval(tick, 3000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [user, navigate]);

  return (
    <div className="cv2 min-h-screen flex items-center justify-center px-4">
      <Room />
      <div className="w-full max-w-md cv2-glass cv2-in text-center" style={{ padding: 28 }}>
        {linked ? (
          <>
            <h1 className="cv2-h1 mb-4">Telegram подключён</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#C6D0E0' }}>
              Ответьте боту на 4 коротких вопроса. Если система вам подходит, терминал ECHO-GATE INSIDE откроется на 7 дней,
              как у подписчиков: и в Telegram, и здесь, эта страница перейдёт в него сама.
            </p>
            <a href={BOT} target="_blank" rel="noopener noreferrer" className="cv2-btn cv2-btn-brass w-full mt-6" style={{ padding: '13px 16px', fontSize: 15 }}>
              Открыть бота
            </a>
          </>
        ) : (
          <>
            <h1 className="cv2-h1 mb-4">Подключите Telegram</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#C6D0E0' }}>
              Telegram — наша главная связь: там я отвечаю на ваши вопросы, а почта остаётся запасной. Нажмите кнопку
              и в боте нажмите «Старт». Дальше 4 коротких вопроса, и если система вам подходит, откроются 7 дней
              терминала ECHO-GATE INSIDE, как у подписчиков.
            </p>
            <a
              href={code ? `${BOT}?start=web_${code}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="cv2-btn cv2-btn-brass w-full mt-6"
              style={{ padding: '13px 16px', fontSize: 15, opacity: code ? 1 : 0.6 }}
            >
              Подключить Telegram
            </a>
          </>
        )}
        <p className="mt-4 text-sm">
          <Link
            to="/school/dashboard"
            onClick={clearLinkPending}
            className="underline underline-offset-2"
            style={{ color: '#94A1B8', fontFamily: 'var(--font)' }}
          >
            {linked ? 'В кабинет' : 'Позже, сейчас в кабинет. Там открыт вводный курс'}
          </Link>
        </p>
      </div>
    </div>
  );
}
