import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';

const font = { heading: "'Cormorant Garamond', serif", mono: "'JetBrains Mono', monospace" };
const tabStyle = (active: boolean) => ({
  fontFamily: font.mono,
  fontSize: '12px',
  color: active ? '#e8e0d0' : '#666',
  borderBottom: active ? '2px solid #4a8a4a' : '2px solid transparent',
  padding: '8px 16px',
  cursor: 'pointer' as const,
  background: 'none',
  transition: 'all 0.2s',
});

interface Course { id: string; title: string; subtitle: string | null; is_free: boolean; sort_order: number; }
interface Lesson { id: string; course_id: string; title: string; description: string | null; sort_order: number; }
interface LessonVideo { id?: string; title: string; video_url: string; video_url_alt: string; sort_order: number; }
interface Profile { user_id: string; email: string; full_name: string | null; created_at: string; }
interface UserRole { user_id: string; role: string; }
interface Access { id: string; user_id: string; course_id: string; granted_at: string; expires_at: string | null; }

export default function SchoolAdmin() {
  const { session, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'courses' | 'students' | 'access'>('courses');

  useEffect(() => {
    if (!authLoading && !session) navigate('/school', { replace: true });
    if (!authLoading && session && role !== 'admin') navigate('/school/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  if (authLoading || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
        <p style={{ fontFamily: font.mono }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808', color: '#e8e0d0' }}>
      <header className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/school/dashboard')} className="hover:opacity-70 transition">
            <ArrowLeft size={18} style={{ color: '#666' }} />
          </button>
          <h1 className="text-xl" style={{ fontFamily: font.heading }}>Админ-панель</h1>
        </div>
        <button
          onClick={signOut}
          className="text-xs px-3 py-1.5 rounded border transition hover:bg-white/5"
          style={{ borderColor: '#222', color: '#666', fontFamily: font.mono }}
        >
          Выйти
        </button>
      </header>

      <div className="border-b flex" style={{ borderColor: '#1a1a1a' }}>
        <button style={tabStyle(tab === 'courses')} onClick={() => setTab('courses')}>Курсы</button>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>Студенты</button>
        <button style={tabStyle(tab === 'access')} onClick={() => setTab('access')}>Доступы</button>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {tab === 'courses' && <CoursesTab />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'access' && <AccessTab />}
      </main>
    </div>
  );
}

/* ========= COURSES TAB ========= */
function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '', is_free: false });
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', is_free: false });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', sort_order: 0 });
  const [lessonVideos, setLessonVideos] = useState<LessonVideo[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonForm, setEditLessonForm] = useState({ title: '', description: '' });
  const [editLessonVideos, setEditLessonVideos] = useState<LessonVideo[]>([]);

  const load = async () => {
    const [c, l] = await Promise.all([
      supabase.from('courses').select('*').order('sort_order'),
      supabase.from('lessons').select('*').order('sort_order'),
    ]);
    setCourses(c.data || []);
    setLessons(l.data || []);
  };

  useEffect(() => { load(); }, []);

  const addCourse = async () => {
    if (!form.title) return;
    await supabase.from('courses').insert({
      title: form.title,
      subtitle: form.subtitle || null,
      is_free: form.is_free,
      sort_order: courses.length,
    });
    setForm({ title: '', subtitle: '', is_free: false });
    setShowAddCourse(false);
    load();
  };

  const deleteCourse = async (id: string) => {
    await supabase.from('lessons').delete().eq('course_id', id);
    await supabase.from('courses').delete().eq('id', id);
    load();
  };

  const startEdit = (c: Course) => {
    setEditingCourse(c.id);
    setEditForm({ title: c.title, subtitle: c.subtitle || '', is_free: c.is_free });
  };

  const updateCourse = async () => {
    if (!editingCourse || !editForm.title) return;
    await supabase.from('courses').update({
      title: editForm.title,
      subtitle: editForm.subtitle || null,
      is_free: editForm.is_free,
    }).eq('id', editingCourse);
    setEditingCourse(null);
    load();
  };

  const addLesson = async (courseId: string) => {
    if (!lessonForm.title) return;
    const courseLessons = lessons.filter(l => l.course_id === courseId);
    await supabase.from('lessons').insert({
      course_id: courseId,
      title: lessonForm.title,
      video_url: lessonForm.video_url || null,
      video_url_alt: lessonForm.video_url_alt || null,
      description: lessonForm.description || null,
      sort_order: lessonForm.sort_order || courseLessons.length,
    });
    setLessonForm({ title: '', video_url: '', video_url_alt: '', description: '', sort_order: 0 });
    setShowAddLesson(null);
    load();
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg" style={{ fontFamily: font.heading }}>Курсы</h2>
        <button
          onClick={() => setShowAddCourse(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}
        >
          <Plus size={14} /> Добавить
        </button>
      </div>

      {showAddCourse && (
        <div className="rounded-lg border p-4 mb-4 space-y-3" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
          <input
            placeholder="Название курса"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
          />
          <input
            placeholder="Подзаголовок"
            value={form.subtitle}
            onChange={e => setForm({ ...form, subtitle: e.target.value })}
            className="w-full px-3 py-2 rounded border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
          />
          <label className="flex items-center gap-2 text-xs" style={{ color: '#999', fontFamily: font.mono }}>
            <input type="checkbox" checked={form.is_free} onChange={e => setForm({ ...form, is_free: e.target.checked })} />
            Бесплатный
          </label>
          <div className="flex gap-2">
            <button onClick={addCourse} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>
              Сохранить
            </button>
            <button onClick={() => setShowAddCourse(false)} className="text-xs px-4 py-2 rounded" style={{ color: '#666', fontFamily: font.mono }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {courses.map(c => (
          <div key={c.id} className="rounded-lg border" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
            >
              <div>
                <span className="text-sm" style={{ fontFamily: font.mono }}>{c.title}</span>
                <span className="ml-2 text-xs" style={{ color: c.is_free ? '#4a8a4a' : '#666', fontFamily: font.mono }}>
                  {c.is_free ? 'бесплатный' : 'платный'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); startEdit(c); }}
                  className="p-1 hover:opacity-70"
                >
                  <Pencil size={14} style={{ color: '#666' }} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteCourse(c.id); }}
                  className="p-1 hover:opacity-70"
                >
                  <Trash2 size={14} style={{ color: '#666' }} />
                </button>
              </div>
            </div>

            {editingCourse === c.id && (
              <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: '#1a1a1a' }}>
                <input
                  placeholder="Название курса"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
                />
                <input
                  placeholder="Подзаголовок"
                  value={editForm.subtitle}
                  onChange={e => setEditForm({ ...editForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
                />
                <label className="flex items-center gap-2 text-xs" style={{ color: '#999', fontFamily: font.mono }}>
                  <input type="checkbox" checked={editForm.is_free} onChange={e => setEditForm({ ...editForm, is_free: e.target.checked })} />
                  Бесплатный
                </label>
                <div className="flex gap-2">
                  <button onClick={updateCourse} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>
                    Сохранить
                  </button>
                  <button onClick={() => setEditingCourse(null)} className="text-xs px-4 py-2 rounded" style={{ color: '#666', fontFamily: font.mono }}>
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {expandedCourse === c.id && (
              <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: '#1a1a1a' }}>
                {lessons.filter(l => l.course_id === c.id).map(l => (
                  <div key={l.id} className="flex items-center justify-between text-xs py-1.5" style={{ fontFamily: font.mono, color: '#999' }}>
                    <span>{l.sort_order + 1}. {l.title}</span>
                    <button onClick={() => deleteLesson(l.id)} className="hover:opacity-70"><Trash2 size={12} style={{ color: '#444' }} /></button>
                  </div>
                ))}

                {showAddLesson === c.id ? (
                  <div className="space-y-2 pt-2">
                    <input placeholder="Название урока" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded border text-xs" style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                    <input placeholder="URL видео (YouTube)" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      className="w-full px-3 py-2 rounded border text-xs" style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                    <input placeholder="Ссылка для России (Дзен/RuTube)" value={lessonForm.video_url_alt} onChange={e => setLessonForm({ ...lessonForm, video_url_alt: e.target.value })}
                      className="w-full px-3 py-2 rounded border text-xs" style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                    <textarea placeholder="Описание" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                      className="w-full px-3 py-2 rounded border text-xs" rows={2} style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                    <div className="flex gap-2">
                      <button onClick={() => addLesson(c.id)} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>Добавить</button>
                      <button onClick={() => setShowAddLesson(null)} className="text-xs px-3 py-1.5" style={{ color: '#666', fontFamily: font.mono }}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddLesson(c.id)}
                    className="flex items-center gap-1 text-xs mt-1"
                    style={{ color: '#4a8a4a', fontFamily: font.mono }}
                  >
                    <Plus size={12} /> Добавить урок
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========= STUDENTS TAB ========= */
function StudentsTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grantModal, setGrantModal] = useState<string | null>(null);
  const [grantCourseId, setGrantCourseId] = useState('');
  const [grantDays, setGrantDays] = useState(30);

  const load = async () => {
    const [p, r, c] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('courses').select('*').order('sort_order'),
    ]);
    setProfiles(p.data || []);
    setRoles(r.data || []);
    setCourses(c.data || []);
  };

  useEffect(() => { load(); }, []);

  const getRole = (uid: string) => roles.find(r => r.user_id === uid)?.role || 'student';

  const grantAccess = async () => {
    if (!grantModal || !grantCourseId) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + grantDays);
    await supabase.from('course_access').insert({
      user_id: grantModal,
      course_id: grantCourseId,
      expires_at: expiresAt.toISOString(),
    });
    setGrantModal(null);
    setGrantCourseId('');
  };

  return (
    <div>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Студенты</h2>

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
              <option value="">Выберите курс</option>
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
              <button onClick={() => setGrantModal(null)} className="text-xs px-4 py-2" style={{ color: '#666', fontFamily: font.mono }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: font.mono }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Email</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Дата</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Роль</th>
              <th className="text-left py-2" style={{ color: '#666' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.user_id} style={{ borderBottom: '1px solid #111' }}>
                <td className="py-2.5 pr-4" style={{ color: '#e8e0d0' }}>{p.email}</td>
                <td className="py-2.5 pr-4" style={{ color: '#666' }}>{new Date(p.created_at).toLocaleDateString('ru')}</td>
                <td className="py-2.5 pr-4" style={{ color: getRole(p.user_id) === 'admin' ? '#4a8a4a' : '#666' }}>{getRole(p.user_id)}</td>
                <td className="py-2.5">
                  <button
                    onClick={() => { setGrantModal(p.user_id); setGrantCourseId(''); }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: '#4a8a4a', border: '1px solid #1a1a1a' }}
                  >
                    Доступ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ========= ACCESS TAB ========= */
function AccessTab() {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const load = async () => {
      const [a, p, c] = await Promise.all([
        supabase.from('course_access').select('*').order('granted_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
      ]);
      setAccesses(a.data || []);
      setProfiles(p.data || []);
      setCourses(c.data || []);
    };
    load();
  }, []);

  const getEmail = (uid: string) => profiles.find(p => p.user_id === uid)?.email || uid;
  const getCourse = (cid: string) => courses.find(c => c.id === cid)?.title || cid;

  const removeAccess = async (id: string) => {
    await supabase.from('course_access').delete().eq('id', id);
    setAccesses(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Доступы</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: font.mono }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Студент</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Курс</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Выдан</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Истекает</th>
              <th className="text-left py-2" style={{ color: '#666' }}></th>
            </tr>
          </thead>
          <tbody>
            {accesses.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #111' }}>
                <td className="py-2.5 pr-4" style={{ color: '#e8e0d0' }}>{getEmail(a.user_id)}</td>
                <td className="py-2.5 pr-4" style={{ color: '#e8e0d0' }}>{getCourse(a.course_id)}</td>
                <td className="py-2.5 pr-4" style={{ color: '#666' }}>{new Date(a.granted_at).toLocaleDateString('ru')}</td>
                <td className="py-2.5 pr-4" style={{ color: a.expires_at ? '#999' : '#444' }}>
                  {a.expires_at ? new Date(a.expires_at).toLocaleDateString('ru') : '∞'}
                </td>
                <td className="py-2.5">
                  <button onClick={() => removeAccess(a.id)} className="hover:opacity-70">
                    <Trash2 size={12} style={{ color: '#666' }} />
                  </button>
                </td>
              </tr>
            ))}
            {accesses.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center" style={{ color: '#444' }}>Нет активных доступов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
