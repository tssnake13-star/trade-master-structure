import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logo from '@/assets/logo-tradeliketyo.jpeg';

export default function SchoolAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const LogoBlock = () => (
    <div className="flex flex-col items-center mb-6">
      <img src={logo} alt="TRADELIKETYO" className="rounded-xl object-cover" style={{ width: '7.8rem', height: '7.8rem' }} />
      <p className="mt-3 text-xs tracking-[0.3em] uppercase" style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
        Вход в систему
      </p>
    </div>
  );

  if (isForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#080808' }}>
        <div className="w-full max-w-md">
          <LogoBlock />
          <h1 className="text-3xl mb-8 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#e8e0d0' }}>
            Сброс пароля
          </h1>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace" }}
            />
            {error && <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>}
            {success && <p className="text-sm" style={{ color: '#4a8a4a' }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all"
              style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '...' : 'Отправить ссылку'}
            </button>
          </form>
          <p
            className="mt-6 text-center text-sm cursor-pointer"
            style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}
            onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}
          >
            ← Вернуться ко входу
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#080808' }}>
      <div className="w-full max-w-md">
        <LogoBlock />
        <h1
          className="text-3xl mb-8 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#e8e0d0' }}
        >
          {isLogin ? 'Вход в школу' : 'Регистрация'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace" }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace" }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace" }}
          />

          {error && <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        {isLogin && (
          <p
            className="mt-4 text-center text-sm cursor-pointer"
            style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}
            onClick={() => { setIsForgot(true); setError(''); }}
          >
            Забыли пароль?
          </p>
        )}

        <p
          className="mt-2 text-center text-sm cursor-pointer"
          style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  );
}
