import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function SchoolResetPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via recovery link — ready to set new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess('Пароль успешно изменён. Перенаправляем...');
      setTimeout(() => navigate('/school/dashboard', { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-school-skin className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#080808' }}>
      <div className="w-full max-w-md">
        <h1 className="text-3xl mb-8 text-center" style={{ fontFamily: "'Inter', sans-serif", color: '#e8e0d0' }}>
          Новый пароль
        </h1>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: "'Inter', sans-serif" }}
          />
          {error && <p className="text-sm" style={{ color: '#e85d3a' }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: '#4a8a4a' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-medium text-sm transition-all"
            style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: "'Inter', sans-serif", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}
