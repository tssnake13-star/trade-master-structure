import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, Plus, ChevronRight, Unlock } from 'lucide-react';

const font = { heading: "'Inter', sans-serif", mono: "'Inter', sans-serif" };

interface Profile { user_id: string; email: string; full_name: string | null; created_at: string; is_blocked: boolean; }
interface Course { id: string; title: string; subtitle: string | null; is_free: boolean; sort_order: number; }
interface Lesson { id: string; course_id: string; title: string; sort_order: number; }
interface Access { id: string; user_id: string; course_id: string; granted_at: string; expires_at: string | null; unlocked_lessons: number[]; }
interface InviteCode { id: string; code: string; course_id: string | null; used_by: string | null; }

export default function SchoolStudentDetail() {
  const { id: studentId } = useParams<{ id: string }>();
  const { session, role, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentRole, setStudentRole] = useState('student');
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [progressIds, setProgressIds] = useState<Set<string>>(new Set());
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [grantModal, setGrantModal] = useState(false);
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantDays, setGrantDays] = useState(30);
  const [removeAccessConfirm, setRemoveAccessConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
    if (!authLoading && session && role !== 'admin') navigate('/school/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  const load = async () => {
    if (!studentId) return;
    const [pRes, rRes, cRes, lRes, aRes, prRes, icRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', studentId).single(),
      supabase.from('user_roles').select('role').eq('user_id', studentId).single(),
      supabase.from('courses').select('*').order('sort_order'),
      supabase.from('lessons').select('*').order('sort_order'),
      supabase.from('course_access').select('*').eq('user_id', studentId),
      supabase.from('lesson_progress').select('lesson_id').eq('user_id', studentId),
      supabase.from('invite_codes').select('code').eq('used_by', studentId).limit(1),
    ]);
    setProfile(pRes.data as Profile | null);
    setStudentRole(rRes.data?.role || 'student');
    setCourses(cRes.data || []);
    setLessons(lRes.data || []);
    setAccesses((aRes.data || []) as Access[]);
    setProgressIds(new Set((prRes.data || []).map((p: any) => p.lesson_id)));
    setInviteCode(icRes.data?.[0]?.code || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [studentId]);

  const isSelf = user?.id === studentId;

  const toggleBlock = async () => {
    if (!profile) return;
    await supabase.from('profiles').update({ is_blocked: !profile.is_blocked }).eq('user_id', studentId!);
    load();
  };

  const deleteStudent = async () => {
    await supabase.rpc('delete_student', { _user_id: studentId! });
    navigate('/school/admin');
  };

  const grantAccess = async () => {
    if (!grantCourseId || !studentId) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + grantDays);
    await supabase.from('course_access').insert({
      user_id: studentId,
      course_id: grantCourseId,
      expires_at: expiresAt.toISOString(),
      unlocked_lessons: [1],
    });
    setGrantModal(false);
    setGrantCourseId('');
    load();
  };

  const unlockNext = async (access: Access) => {
    const courseLessons = lessons.filter(l => l.course_id === access.course_id);
    const current = access.unlocked_lessons || [1];
    const maxUnlocked = Math.max(...current, 0);
    const nextOrder = maxUnlocked + 1;
    if (nextOrder > courseLessons.length) return;
    await supabase.from('course_access').update({ unlocked_lessons: [...current, nextOrder] }).eq('id', access.id);
    load();
  };

  const unlockAll = async (access: Access) => {
    const courseLessons = lessons.filter(l => l.course_id === access.course_id);
    const all = courseLessons.map((_, i) => i + 1);
    await supabase.from('course_access').update({ unlocked_lessons: all }).eq('id', access.id);
    load();
  };

  const removeAccess = async (id: string) => {
    await supabase.from('course_access').delete().eq('id', id);
    setRemoveAccessConfirm(null);
    load();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Студент не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <header className="border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: '#1a1a1a' }}>
        <button onClick={() => navigate('/school/admin')} className="hover:opacity-70 transition">
          <ArrowLeft size={18} style={{ color: '#666' }} />
        </button>
        <h1 className="text-xl" style={{ fontFamily: font.heading }}>
          {profile.full_name || profile.email}
        </h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">

        {/* ======== PROFILE BLOCK ======== */}
        <section className="rounded-lg border p-5 space-y-3" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
          <h2 className="text-sm mb-3" style={{ fontFamily: font.heading, color: '#888' }}>Профиль</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Имя" value={profile.full_name || '—'} />
            <Field label="Email" value={profile.email} />
            <Field label="Дата регистрации" value={new Date(profile.created_at).toLocaleDateString('ru')} />
            <Field label="Роль" value={studentRole} color={studentRole === 'admin' ? '#4a8a4a' : undefined} />
            <Field
              label="Статус"
              value={profile.is_blocked ? 'Заблокирован' : 'Активен'}
              color={profile.is_blocked ? '#c45050' : '#4a8a4a'}
            />
            <Field label="Инвайт-код" value={inviteCode || '—'} />
          </div>
        </section>

        {/* ======== ACCESS BLOCK ======== */}
        <section className="rounded-lg border p-5" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm" style={{ fontFamily: font.heading, color: '#888' }}>Доступы</h2>
            <button
              onClick={() => { setGrantModal(true); setGrantCourseId(''); }}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded"
              style={{ color: '#4a8a4a', border: '1px solid #1a1a1a', fontFamily: font.mono }}
            >
              <Plus size={12} /> Добавить доступ
            </button>
          </div>

          {accesses.length === 0 ? (
            <p className="text-[11px]" style={{ color: '#444', fontFamily: font.mono }}>Нет доступов к программам</p>
          ) : (
            <div className="space-y-2">
              {accesses.map(acc => {
                const course = courses.find(c => c.id === acc.course_id);
                if (!course) return null;
                const courseLessons = lessons.filter(l => l.course_id === acc.course_id).sort((a, b) => a.sort_order - b.sort_order);
                const unlocked = acc.unlocked_lessons || [1];
                const unlockedCount = unlocked.length;
                const totalLessons = courseLessons.length;

                const completedInCourse = courseLessons.filter(l => progressIds.has(l.id));
                const currentLesson = courseLessons.find((l, i) => unlocked.includes(i + 1) && !progressIds.has(l.id));
                const currentIndex = currentLesson ? courseLessons.indexOf(currentLesson) + 1 : null;
                const allDone = unlockedCount > 0 && courseLessons.filter((_, i) => unlocked.includes(i + 1)).every(l => progressIds.has(l.id));

                return (
                  <div key={acc.id} className="rounded border px-4 py-3" style={{ borderColor: '#1a1a1a', backgroundColor: '#111' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>{course.title}</span>
                      <span className="text-[11px]" style={{ fontFamily: font.mono, color: '#555' }}>
                        {unlockedCount}/{totalLessons} открыто
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px]" style={{ fontFamily: font.mono, color: allDone ? '#4a8a4a' : '#888' }}>
                        {allDone ? 'Все пройдено ✓' : currentIndex ? `Сейчас на занятии ${currentIndex}` : 'Не начато'}
                      </span>
                      {acc.expires_at && (
                        <span className="text-[11px]" style={{ fontFamily: font.mono, color: '#555' }}>
                          до {new Date(acc.expires_at).toLocaleDateString('ru')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {unlockedCount < totalLessons && (
                        <button
                          onClick={() => unlockNext(acc)}
                          className="text-[11px] px-2.5 py-1 rounded flex items-center gap-1"
                          style={{ color: '#4a8a4a', border: '1px solid #1a1a1a', fontFamily: font.mono }}
                        >
                          <ChevronRight size={11} /> Следующее
                        </button>
                      )}
                      {unlockedCount < totalLessons && (
                        <button
                          onClick={() => unlockAll(acc)}
                          className="text-[11px] px-2.5 py-1 rounded flex items-center gap-1"
                          style={{ color: '#888', border: '1px solid #1a1a1a', fontFamily: font.mono }}
                        >
                          <Unlock size={11} /> Все занятия
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveAccessConfirm(acc.id)}
                        className="text-[11px] px-2.5 py-1 rounded flex items-center gap-1"
                        style={{ color: '#c45050', border: '1px solid #1a1a1a', fontFamily: font.mono }}
                      >
                        <Trash2 size={11} /> Удалить доступ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ======== ACTIONS BLOCK ======== */}
        {!isSelf && (
          <section className="rounded-lg border p-5" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
            <h2 className="text-sm mb-4" style={{ fontFamily: font.heading, color: '#888' }}>Действия</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleBlock}
                className="text-xs px-4 py-2 rounded flex items-center gap-1.5"
                style={{
                  color: profile.is_blocked ? '#4a8a4a' : '#c45050',
                  border: '1px solid #1a1a1a',
                  fontFamily: font.mono,
                }}
              >
                {profile.is_blocked ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
                {profile.is_blocked ? 'Разблокировать' : 'Заблокировать'}
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs px-4 py-2 rounded flex items-center gap-1.5"
                style={{ color: '#c45050', border: '1px solid #1a1a1a', fontFamily: font.mono }}
              >
                <Trash2 size={13} /> Удалить аккаунт
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl border p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: '#0d0d0d', borderColor: '#1a1a1a' }}>
            <h3 className="text-base" style={{ fontFamily: font.heading }}>Удалить студента?</h3>
            <p className="text-sm" style={{ color: '#888', fontFamily: font.mono }}>Это действие необратимо.</p>
            <div className="flex gap-2">
              <button onClick={deleteStudent} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#8a4a4a', color: '#e8e0d0', fontFamily: font.mono }}>
                Удалить
              </button>
              <button onClick={() => setDeleteConfirm(false)} className="text-xs px-4 py-2" style={{ color: '#666', fontFamily: font.mono }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove access confirmation */}
      {removeAccessConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl border p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: '#0d0d0d', borderColor: '#1a1a1a' }}>
            <h3 className="text-base" style={{ fontFamily: font.heading }}>Удалить доступ?</h3>
            <p className="text-sm" style={{ color: '#888', fontFamily: font.mono }}>Студент потеряет доступ к программе.</p>
            <div className="flex gap-2">
              <button onClick={() => removeAccess(removeAccessConfirm)} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#8a4a4a', color: '#e8e0d0', fontFamily: font.mono }}>
                Удалить
              </button>
              <button onClick={() => setRemoveAccessConfirm(null)} className="text-xs px-4 py-2" style={{ color: '#666', fontFamily: font.mono }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant access modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-xl border p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: '#0d0d0d', borderColor: '#1a1a1a' }}>
            <h3 className="text-base" style={{ fontFamily: font.heading }}>Открыть доступ</h3>
            <select
              value={grantCourseId}
              onChange={e => setGrantCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
            >
              <option value="">Выберите программу</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input
              type="number"
              value={grantDays}
              onChange={e => setGrantDays(Number(e.target.value))}
              placeholder="Дней доступа"
              className="w-full px-3 py-2 rounded border text-sm"
              style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
            />
            <div className="flex gap-2">
              <button onClick={grantAccess} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>
                Открыть
              </button>
              <button onClick={() => setGrantModal(false)} className="text-xs px-4 py-2" style={{ color: '#666', fontFamily: font.mono }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <span className="text-[10px] block mb-0.5" style={{ color: '#555', fontFamily: font.mono }}>{label}</span>
      <span className="text-xs" style={{ color: color || '#e8e0d0', fontFamily: font.mono }}>{value}</span>
    </div>
  );
}
