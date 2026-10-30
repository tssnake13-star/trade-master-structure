import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logoFallback from '@/assets/logo-tradeliketyo.png';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import '@/styles/cabinet-v2.css';
import Room from '@/components/cabinet2/Room';
import StepMark from '@/components/cabinet2/StepMark';
import { clearLinkPending, fmtTrialDate, linkPending, markLinkPending, pendingWebTrial, webTrialUntil } from '@/lib/webTrial';
import { visitSource } from '@/lib/analytics';

function LogoBlock({ logo }: { logo: string }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <img src={logo} alt="TRADELIKETYO" className="rounded-xl object-cover" style={{ width: '7.5rem', height: '7.5rem' }} />
      <span className="mt-4" style={{ color: 'var(--mut)', fontSize: 14 }}>Кабинет TRADE LIKE TYO</span>
    </div>
  );
}

export default function SchoolAuth() {
  // ?signup=1 открывает сразу регистрацию, а не вход: по этой ссылке приходят новые люди
  // (короткий адрес tradeliketyo.com/terminal в vercel.json, эфиры с 11.10.2026)
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => searchParams.get('signup') !== '1');
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  // 11.10.2026: поле кода спрятано — открытое «Инвайт-код (необязательно)» читалось как «без кода нельзя»
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const logo = useSiteAsset(SITE_ASSET_KEYS.schoolAuthLogo, logoFallback);
  // 30.10.2026: пришёл по ссылке «Полная версия на компьютере» из школьного бота — после входа терминал откроется сам
  const [fullTrial] = useState(() => pendingWebTrial());
  const fullUntil = webTrialUntil(fullTrial);

  useEffect(() => {
    // 30.10.2026: только что зарегистрировался — сначала «Подключите Telegram»
    if (session) navigate(pendingWebTrial() ? '/school/full' : linkPending() ? '/school/telegram' : '/school/dashboard', { replace: true });
  }, [session, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/school/reset-password`,
      });
      if (error) throw error;
      setSuccess('Письмо для сброса пароля отправлено на ' + email);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Validate invite code if provided
        if (inviteCode.trim()) {
          const { data: isValid, error: codeErr } = await supabase.rpc('validate_invite_code', { _code: inviteCode });
          if (codeErr) throw codeErr;
          if (!isValid) {
            setError('Инвайт-код недействителен или уже использован');
            setLoading(false);
            return;
          }
        }

        // метка ставится до signUp: сессия может прийти сразу, и переход случится раньше следующей строки
        markLinkPending();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, source: visitSource() } },
        });
        if (signUpError) {
          clearLinkPending();
          throw signUpError;
        }

        // Mark invite code as used if provided
        if (inviteCode.trim() && signUpData.user) {
          await supabase.rpc('use_invite_code', { _code: inviteCode, _user_id: signUpData.user.id });
        }

        // Если база требует подтвердить почту, сессии ещё нет и переход в кабинет не случится:
        // без этой строки человек видел ту же форму и не понимал, что дальше
        if (!signUpData.session) {
          setSuccess(`Письмо отправлено на ${email}. Подтвердите почту, и кабинет откроется.`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="cv2 min-h-screen flex items-center justify-center px-4">
        <Room />
        <div className="w-full max-w-md cv2-glass cv2-in" style={{ padding: 28 }}>
          <LogoBlock logo={logo} />
          <h1 className="cv2-h1 mb-6 text-center">Сброс пароля</h1>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="cv2-input" style={{ padding: '12px 14px', fontSize: 15 }}
            />
            {error && <p className="text-sm" style={{ color: '#E8875A' }}>{error}</p>}
            {success && <p className="text-sm" style={{ color: '#CDAA6E' }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="cv2-btn cv2-btn-brass w-full" style={{ padding: '13px 16px', fontSize: 15, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '...' : 'Отправить ссылку'}
            </button>
          </form>
          <p
            className="mt-6 text-center text-sm cursor-pointer"
            style={{ color: '#94A1B8', fontFamily: 'var(--font)' }}
            onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}
          >
            ← Вернуться ко входу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cv2 min-h-screen flex items-center justify-center px-4">
      {/* 29.10.2026: вход в кабинет v2 — та же комната за стеклом, форма в стеклянном окне */}
      <Room />
      <div className="w-full max-w-md cv2-glass cv2-in" style={{ padding: 28 }}>
        <LogoBlock logo={logo} />
        {/* 30.10.2026: по ссылке из бота Telegram уже есть, второго шага нет */}
        {!isLogin && !fullTrial && <StepMark step={1} total={2} label="аккаунт" />}
        {!isLogin && (
          <h1 className="cv2-h1 mb-6 text-center">Регистрация</h1>
        )}
        {/* 07.10.2026: при регистрации сам открывается пробный доступ к терминалу (триггер в базе).
            11.10.2026: до формы человек видит, что именно получит (разбор плана GPT, п.19) */}
        {fullTrial && (
          <p className="mb-6 text-sm leading-relaxed px-2 text-center" style={{ color: '#C6D0E0' }}>
            {isLogin ? 'Войдите или зарегистрируйтесь' : 'Зарегистрируйтесь'}, и откроется терминал ECHO-GATE INSIDE целиком, как
            у подписчиков{fullUntil ? `, до ${fmtTrialDate(fullUntil)}` : ''}.
          </p>
        )}
        {!isLogin && !fullTrial && (
          <div className="mb-6 text-sm leading-relaxed px-2" style={{ color: '#C6D0E0' }}>
            {/* 19.10.2026, его «все 7 пунктов согласен»: проба терминала — только через бота после 4 вопросов.
                30.10.2026: следующий шаг регистрации — подключить Telegram (/school/telegram) */}
            <p className="text-center">Регистрация бесплатная. Сразу откроется вводный курс.</p>
            <p className="mt-2 text-center">
              Шаг 2: вы подключите Telegram. После 4 коротких вопросов в боте откроются 7 дней терминала
              <span className="whitespace-nowrap">ECHO-GATE INSIDE</span>, как у подписчиков.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="cv2-input" style={{ padding: '12px 14px', fontSize: 15 }}
            />
          )}
          {!isLogin && showInvite && (
            <input
              type="text"
              placeholder="Инвайт-код"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="cv2-input" style={{ padding: '12px 14px', fontSize: 15 }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="cv2-input" style={{ padding: '12px 14px', fontSize: 15 }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="cv2-input" style={{ padding: '12px 14px', fontSize: 15 }}
          />

          {error && <p className="text-sm" style={{ color: '#E8875A' }}>{error}</p>}
          {!isLogin && success && <p className="text-sm" style={{ color: '#CDAA6E' }}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="cv2-btn cv2-btn-brass w-full" style={{ padding: '13px 16px', fontSize: 15, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        {!isLogin && !showInvite && (
          <p className="mt-3 text-center text-xs">
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="underline underline-offset-2 hover:text-[#CDAA6E] transition-colors"
              style={{ color: '#7D8AA0', fontFamily: 'var(--font)' }}
            >
              Есть инвайт-код?
            </button>
          </p>
        )}

        {/* 07.10.2026: документы появились, ссылки открываются в новой вкладке, чтобы не терять заполненную форму */}
        {!isLogin && (
          <p className="mt-3 text-center text-[11px] leading-snug px-2" style={{ color: '#7D8AA0', fontFamily: 'var(--font)' }}>
            Регистрируясь, вы соглашаетесь с обработкой персональных данных в соответствии с{' '}
            <a href="/privacy" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-[#CDAA6E] transition-colors">политикой конфиденциальности</a>
            {' '}и принимаете{' '}
            <a href="/terms" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-[#CDAA6E] transition-colors">пользовательское соглашение</a>.
          </p>
        )}

        {isLogin && (
          <p
            className="mt-4 text-center text-sm cursor-pointer"
            style={{ color: '#94A1B8', fontFamily: 'var(--font)' }}
            onClick={() => { setIsForgot(true); setError(''); }}
          >
            Забыли пароль?
          </p>
        )}

        <p
          className="mt-2 text-center text-sm cursor-pointer"
          style={{ color: '#94A1B8', fontFamily: 'var(--font)' }}
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  );
}
