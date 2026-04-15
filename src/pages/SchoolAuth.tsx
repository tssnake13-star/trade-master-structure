import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function SchoolAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate('/school/dashboard', { replace: true });
  }, [session, navigate]);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#080808' }}>
      <div className="w-full max-w-md">
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
              placeholder="Имя"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-sm"
              style={{
                backgroundColor: '#111',
                borderColor: '#222',
                color: '#e8e0d0',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{
              backgroundColor: '#111',
              borderColor: '#222',
              color: '#e8e0d0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{
              backgroundColor: '#111',
              borderColor: '#222',
              color: '#e8e0d0',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />

          {error && (
            <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all"
            style={{
              backgroundColor: '#4a8a4a',
              color: '#e8e0d0',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '...' : isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm cursor-pointer"
          style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
        >
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  );
}
