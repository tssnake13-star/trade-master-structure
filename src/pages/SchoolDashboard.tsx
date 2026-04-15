import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function SchoolDashboard() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate('/school', { replace: true });
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace" }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Личный кабинет
          </h1>
          <button
            onClick={signOut}
            className="text-sm px-4 py-2 rounded-lg border"
            style={{ borderColor: '#222', color: '#666', fontFamily: "'JetBrains Mono', monospace" }}
          >
            Выйти
          </button>
        </div>
        <p className="text-sm" style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace" }}>
          Дашборд будет реализован в следующем этапе.
        </p>
      </div>
    </div>
  );
}
