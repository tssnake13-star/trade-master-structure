import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logoFallback from '@/assets/logo-tradeliketyo.png';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import ConstellationBg from '@/components/ConstellationBg';

function LogoBlock({ logo }: { logo: string }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <img src={logo} alt="TRADELIKETYO" className="rounded-xl object-cover" style={{ width: '12rem', height: '12rem' }} />
      <span className="mt-5 text-[10px] uppercase tracking-[0.22em]" style={{ color: '#666', fontFamily: "'Martian Mono', ui-monospace, monospace" }}>
        Вход в систему
      </span>
    </div>
  );
}

export default function SchoolAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const logo = useSiteAsset(SITE_ASSET_KEYS.schoolAuthLogo, logoFallback);

  useEffect(() => {
    if (session) navigate('/school/dashboard', { replace: true });
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

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        // Mark invite code as used if provided
        if (inviteCode.trim() && signUpData.user) {
          await supabase.rpc('use_invite_code', { _code: inviteCode, _user_id: signUpData.user.id });
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
      <div data-school-skin className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#080808' }}>
        <div className="w-full max-w-md">
          <LogoBlock logo={logo} />
          <h1 className="text-4xl mb-8 text-center tly-display" style={{ color: '#e8e0d0' }}>
            Сброс <em>пароля</em>
          </h1>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#e8e0d0', fontFamily: "'Hanken Grotesk', sans-serif" }}
            />
            {error && <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>}
            {success && <p className="text-sm" style={{ color: '#caa472' }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: '#caa472', color: '#0a0a0a', fontFamily: "'Martian Mono', ui-monospace, monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 500, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '...' : 'Отправить ссылку'}
            </button>
          </form>
          <p
            className="mt-6 text-center text-sm cursor-pointer"
            style={{ color: '#666', fontFamily: "'Hanken Grotesk', sans-serif" }}
            onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}
          >
            ← Вернуться ко входу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-school-skin className="min-h-screen flex items-center justify-center px-4 relative z-10" style={{ backgroundColor: '#080808' }}>
      <ConstellationBg />
      <div className="w-full max-w-md">
        <LogoBlock logo={logo} />
        {!isLogin && (
          <h1 className="text-4xl mb-8 text-center tly-display" style={{ color: '#e8e0d0' }}>
            Регис<em>трация</em>
          </h1>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#e8e0d0', fontFamily: "'Hanken Grotesk', sans-serif" }}
            />
          )}
          {!isLogin && (
            <input
              type="text"
              placeholder="Инвайт-код (необязательно)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#e8e0d0', fontFamily: "'Hanken Grotesk', sans-serif" }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#e8e0d0', fontFamily: "'Hanken Grotesk', sans-serif" }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#0a0a0a', borderColor: '#1f1f1f', color: '#e8e0d0', fontFamily: "'Hanken Grotesk', sans-serif" }}
          />

          {error && <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: '#caa472', color: '#0a0a0a', fontFamily: "'Martian Mono', ui-monospace, monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 500, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        {!isLogin && (
          <p className="mt-3 text-center text-[10px] leading-snug px-2" style={{ color: '#555', fontFamily: "'Hanken Grotesk', sans-serif" }}>
            Регистрируясь, вы соглашаетесь с обработкой персональных данных в соответствии с политикой конфиденциальности и принимаете пользовательское соглашение.
          </p>
        )}

        {isLogin && (
          <p
            className="mt-4 text-center text-sm cursor-pointer"
            style={{ color: '#666', fontFamily: "'Hanken Grotesk', sans-serif" }}
            onClick={() => { setIsForgot(true); setError(''); }}
          >
            Забыли пароль?
          </p>
        )}

        <p
          className="mt-2 text-center text-sm cursor-pointer"
          style={{ color: '#666', fontFamily: "'Hanken Grotesk', sans-serif" }}
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  );
}
