import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminFloatingButton() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;
  if (role !== 'admin') return null;
  // Не показываем на самой админ-странице и на странице авторизации
  if (location.pathname.startsWith('/school/admin')) return null;
  if (location.pathname === '/school' || location.pathname === '/school/reset-password') return null;

  return (
    <button
      onClick={() => navigate('/school/admin')}
      title="Админ-панель"
      aria-label="Админ-панель"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 9999,
        width: 44,
        height: 44,
        borderRadius: 8,
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        color: '#d4d4d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <Settings size={18} />
    </button>
  );
}