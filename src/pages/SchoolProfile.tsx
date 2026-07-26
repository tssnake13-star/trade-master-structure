import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Check, KeyRound, User as UserIcon } from 'lucide-react';
import ConstellationBg from '@/components/ConstellationBg';

/**
 * SchoolProfile — «Профиль» ученика (/school/profile).
 * Две задачи: поменять имя и сменить пароль (например, если он где-то
 * засветился). Email не меняем — он привязан к аккаунту и доступам, смена
 * потребовала бы подтверждения на два адреса; при необходимости это делает
 * администратор. Аватарки нет: под неё нужен отдельный storage.
 */

const ACCENT = '#e1a84d';
const BG = '#080808';
const FG = '#e8e0d0';
const CARD = '#181410';
const BORDER = '#1a1a1a';
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Syne', system-ui, sans-serif";
const DISPLAY = "'Cormorant', Georgia, 'Times New Roman', serif";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  backgroundColor: '#0d0b09',
  color: FG,
  fontFamily: SANS,
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#777',
  marginBottom: 8,
  display: 'block',
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px 20px',
  borderRadius: 8,
  backgroundColor: ACCENT,
  color: '#0a0a0a',
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  fontWeight: 500,
  opacity: disabled ? 0.55 : 1,
  cursor: disabled ? 'default' : 'pointer',
  transition: 'filter 0.2s',
});

export default function SchoolProfile() {
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [initialName, setInitialName] = useState('');
  const [loading, setLoading] = useState(true);

  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [nameErr, setNameErr] = useState('');

  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      setFullName(data?.full_name || '');
      setInitialName(data?.full_name || '');
      setEmail(data?.email || user.email || '');
      setLoading(false);
    };
    load();
  }, [user]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || nameSaving) return;
    setNameErr('');
    setNameMsg('');
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setNameErr('Введите имя — минимум 2 символа');
      return;
    }
    setNameSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('user_id', user.id);
    setNameSaving(false);
    if (error) {
      setNameErr(error.message || 'Не удалось сохранить');
      return;
    }
    setInitialName(trimmed);
    setNameMsg('Имя сохранено');
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passSaving) return;
    setPassErr('');
    setPassMsg('');
    if (pass1.length < 6) {
      setPassErr('Пароль должен быть не короче 6 символов');
      return;
    }
    if (pass1 !== pass2) {
      setPassErr('Пароли не совпадают');
      return;
    }
    setPassSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pass1 });
    setPassSaving(false);
    if (error) {
      setPassErr(error.message || 'Не удалось изменить пароль');
      return;
    }
    setPass1('');
    setPass2('');
    setPassMsg('Пароль изменён. В следующий раз входите с новым паролем.');
  };

  if (authLoading || loading) {
    return (
      <div data-school-skin className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, color: FG }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666' }}>Загрузка</p>
      </div>
    );
  }

  return (
    <div data-school-skin className="min-h-screen relative z-10" style={{ backgroundColor: BG, color: FG }}>
      <ConstellationBg />

      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: BORDER, backgroundColor: 'rgba(8,8,8,0.85)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-4">
          <button
            onClick={() => navigate('/school/dashboard')}
            className="flex items-center gap-2 hover:opacity-70 transition"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#888' }}
          >
            <ArrowLeft size={14} />
            Главная / <span style={{ color: ACCENT }}>Профиль</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
          ◆ Профиль
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontWeight: 350, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: FG }}>
          Ваши данные
        </h1>

        {/* Email — только для чтения */}
        <div className="mt-8 p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
          <span style={labelStyle}>Email входа</span>
          <div style={{ fontFamily: SANS, fontSize: 14, color: FG }}>{email}</div>
          <p className="mt-2" style={{ fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5, color: '#8a8378' }}>
            К этому адресу привязаны доступы к программам. Нужно сменить — напишите Сергею.
          </p>
        </div>

        {/* Имя */}
        <form onSubmit={saveName} className="mt-3 p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
          <div className="flex items-center gap-2 mb-4">
            <UserIcon size={14} style={{ color: ACCENT }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: FG }}>Имя</span>
          </div>
          <label style={labelStyle} htmlFor="fullName">Имя и фамилия</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setNameMsg(''); setNameErr(''); }}
            placeholder="Имя и фамилия"
            style={inputStyle}
          />
          {nameErr && <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: '#e85d3a' }}>{nameErr}</p>}
          {nameMsg && (
            <p className="mt-3 flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: ACCENT }}>
              <Check size={14} /> {nameMsg}
            </p>
          )}
          <button type="submit" disabled={nameSaving || fullName.trim() === initialName} className="mt-4 hover:brightness-110" style={btnStyle(nameSaving || fullName.trim() === initialName)}>
            {nameSaving ? '...' : 'Сохранить имя'}
          </button>
        </form>

        {/* Пароль */}
        <form onSubmit={savePassword} className="mt-3 p-5" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, backgroundColor: CARD }}>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={14} style={{ color: ACCENT }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: FG }}>Смена пароля</span>
          </div>
          <label style={labelStyle} htmlFor="pass1">Новый пароль</label>
          <input
            id="pass1"
            type="password"
            value={pass1}
            onChange={e => { setPass1(e.target.value); setPassMsg(''); setPassErr(''); }}
            placeholder="Минимум 6 символов"
            autoComplete="new-password"
            style={inputStyle}
          />
          <label style={{ ...labelStyle, marginTop: 16 }} htmlFor="pass2">Повторите пароль</label>
          <input
            id="pass2"
            type="password"
            value={pass2}
            onChange={e => { setPass2(e.target.value); setPassMsg(''); setPassErr(''); }}
            placeholder="Ещё раз"
            autoComplete="new-password"
            style={inputStyle}
          />
          {passErr && <p className="mt-3" style={{ fontFamily: SANS, fontSize: 13, color: '#e85d3a' }}>{passErr}</p>}
          {passMsg && (
            <p className="mt-3 flex items-center gap-2" style={{ fontFamily: SANS, fontSize: 13, color: ACCENT }}>
              <Check size={14} /> {passMsg}
            </p>
          )}
          <button type="submit" disabled={passSaving || !pass1 || !pass2} className="mt-4 hover:brightness-110" style={btnStyle(passSaving || !pass1 || !pass2)}>
            {passSaving ? '...' : 'Изменить пароль'}
          </button>
        </form>
      </main>
    </div>
  );
}
