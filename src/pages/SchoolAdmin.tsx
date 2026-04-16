import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import VideoBlockEditor from '@/components/school/VideoBlockEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const font = { heading: "'Inter', sans-serif", mono: "'Inter', sans-serif" };
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
interface Profile { user_id: string; email: string; full_name: string | null; created_at: string; is_blocked: boolean; }
interface UserRole { user_id: string; role: string; }
interface Access { id: string; user_id: string; course_id: string; granted_at: string; expires_at: string | null; unlocked_lessons: number[]; }

export default function SchoolAdmin() {
  const { session, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'courses' | 'students' | 'access' | 'invites' | 'settings'>('courses');

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

      <div className="border-b flex overflow-x-auto" style={{ borderColor: '#1a1a1a' }}>
        <button style={tabStyle(tab === 'courses')} onClick={() => setTab('courses')}>Программы</button>
        <button style={tabStyle(tab === 'students')} onClick={() => setTab('students')}>Ученики</button>
        <button style={tabStyle(tab === 'access')} onClick={() => setTab('access')}>Доступы</button>
        <button style={tabStyle(tab === 'invites')} onClick={() => setTab('invites')}>Инвайт-коды</button>
        <button style={tabStyle(tab === 'settings')} onClick={() => setTab('settings')}>Настройки</button>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {tab === 'courses' && <CoursesTab />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'access' && <AccessTab />}
        {tab === 'invites' && <InviteCodesTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

/* ========= SETTINGS TAB ========= */
function SettingsTab() {
  const [welcomeVideo, setWelcomeVideo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'dashboard_welcome_video').single()
      .then(({ data }) => setWelcomeVideo(data?.value || ''));
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').update({ value: welcomeVideo, updated_at: new Date().toISOString() }).eq('key', 'dashboard_welcome_video');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Настройки</h2>
      <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
        <label className="block text-xs mb-1" style={{ color: '#999', fontFamily: font.mono }}>
          Приветственное видео dashboard (YouTube URL)
        </label>
        <input
          value={welcomeVideo}
          onChange={e => setWelcomeVideo(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-3 py-2 rounded border text-sm"
          style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
        />
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono, opacity: saving ? 0.6 : 1 }}>
            {saving ? '...' : 'Сохранить'}
          </button>
          {saved && <span className="text-xs" style={{ color: '#4a8a4a', fontFamily: font.mono }}>Сохранено ✓</span>}
        </div>
      </div>
    </div>
  );
}

/* ========= SORTABLE LESSON ITEM ========= */
function SortableLessonItem({ lesson, children }: { lesson: Lesson; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <button
          className="px-1 py-1 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} style={{ color: '#444' }} />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ========= SORTABLE COURSE ITEM ========= */
function SortableCourseItem({ course, children }: { course: Course; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="rounded-lg border" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
        <div className="flex items-center">
          <button
            className="px-2 py-4 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-l-lg"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} style={{ color: '#444' }} />
          </button>
          {children}
        </div>
      </div>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    const [c, l] = await Promise.all([
      supabase.from('courses').select('*').order('sort_order'),
      supabase.from('lessons').select('*').order('sort_order'),
    ]);
    setCourses(c.data || []);
    setLessons(l.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = courses.findIndex(c => c.id === active.id);
    const newIndex = courses.findIndex(c => c.id === over.id);
    const reordered = arrayMove(courses, oldIndex, newIndex);
    setCourses(reordered);

    // Save new sort_order to DB
    await Promise.all(
      reordered.map((c, i) =>
        supabase.from('courses').update({ sort_order: i }).eq('id', c.id)
      )
    );
  };

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
    const res = await supabase.from('lessons').insert({
      course_id: courseId,
      title: lessonForm.title,
      description: lessonForm.description || null,
      sort_order: lessonForm.sort_order || courseLessons.length,
    }).select('id').single();
    if (res.data && lessonVideos.length > 0) {
      await supabase.from('lesson_videos').insert(
        lessonVideos.filter(v => v.video_url).map(v => ({
          lesson_id: res.data.id,
          title: v.title,
          video_url: v.video_url,
          video_url_alt: v.video_url_alt || null,
          sort_order: v.sort_order,
        }))
      );
    }
    setLessonForm({ title: '', description: '', sort_order: 0 });
    setLessonVideos([]);
    setShowAddLesson(null);
    load();
  };

  const startEditLesson = async (l: Lesson) => {
    setEditingLessonId(l.id);
    setEditLessonForm({ title: l.title, description: l.description || '' });
    const res = await supabase.from('lesson_videos').select('*').eq('lesson_id', l.id).order('sort_order');
    setEditLessonVideos((res.data || []).map((v: any) => ({ id: v.id, title: v.title, video_url: v.video_url, video_url_alt: v.video_url_alt || '', sort_order: v.sort_order })));
  };

  const saveEditLesson = async () => {
    if (!editingLessonId || !editLessonForm.title) return;
    await supabase.from('lessons').update({ title: editLessonForm.title, description: editLessonForm.description || null }).eq('id', editingLessonId);
    await supabase.from('lesson_videos').delete().eq('lesson_id', editingLessonId);
    if (editLessonVideos.length > 0) {
      await supabase.from('lesson_videos').insert(
        editLessonVideos.filter(v => v.video_url).map(v => ({
          lesson_id: editingLessonId,
          title: v.title,
          video_url: v.video_url,
          video_url_alt: v.video_url_alt || null,
          sort_order: v.sort_order,
        }))
      );
    }
    setEditingLessonId(null);
    load();
  };

  const handleLessonDragEnd = async (courseId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const courseLessons = lessons.filter(l => l.course_id === courseId);
    const oldIndex = courseLessons.findIndex(l => l.id === active.id);
    const newIndex = courseLessons.findIndex(l => l.id === over.id);
    const reordered = arrayMove(courseLessons, oldIndex, newIndex);

    // Update local state
    setLessons(prev => [
      ...prev.filter(l => l.course_id !== courseId),
      ...reordered.map((l, i) => ({ ...l, sort_order: i })),
    ].sort((a, b) => a.sort_order - b.sort_order));

    await Promise.all(
      reordered.map((l, i) =>
        supabase.from('lessons').update({ sort_order: i }).eq('id', l.id)
      )
    );
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg" style={{ fontFamily: font.heading }}>Программы</h2>
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
            placeholder="Название программы"
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
            Бесплатная
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={courses.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {courses.map(c => (
              <SortableCourseItem key={c.id} course={c}>
                <div className="flex-1">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
                  >
                    <div>
                      <span className="text-sm" style={{ fontFamily: font.mono }}>{c.title}</span>
                      <span className="ml-2 text-xs" style={{ color: c.is_free ? '#4a8a4a' : '#666', fontFamily: font.mono }}>
                        {c.is_free ? 'бесплатная' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); startEdit(c); }} className="p-1 hover:opacity-70">
                        <Pencil size={14} style={{ color: '#666' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); }} className="p-1 hover:opacity-70">
                        <Trash2 size={14} style={{ color: '#666' }} />
                      </button>
                    </div>
                  </div>

                  {editingCourse === c.id && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: '#1a1a1a' }}>
                      <input
                        placeholder="Название программы"
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
                        Бесплатная
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
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleLessonDragEnd(c.id, e)}>
                        <SortableContext items={lessons.filter(l => l.course_id === c.id).map(l => l.id)} strategy={verticalListSortingStrategy}>
                          {lessons.filter(l => l.course_id === c.id).map(l => (
                            <SortableLessonItem key={l.id} lesson={l}>
                              <div className="flex items-center justify-between text-xs py-1.5" style={{ fontFamily: font.mono, color: '#999' }}>
                                <span>{l.sort_order + 1}. {l.title}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEditLesson(l)} className="hover:opacity-70"><Pencil size={12} style={{ color: '#444' }} /></button>
                                  <button onClick={() => deleteLesson(l.id)} className="hover:opacity-70"><Trash2 size={12} style={{ color: '#444' }} /></button>
                                </div>
                              </div>
                              {editingLessonId === l.id && (
                                <div className="space-y-2 pt-2 pb-3 pl-4 border-l" style={{ borderColor: '#1a1a1a' }}>
                                  <input placeholder="Название занятия" value={editLessonForm.title} onChange={e => setEditLessonForm({ ...editLessonForm, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded border text-xs" style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                                  <textarea placeholder="Описание" value={editLessonForm.description} onChange={e => setEditLessonForm({ ...editLessonForm, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded border text-xs" rows={2} style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                                  <VideoBlockEditor videos={editLessonVideos} onChange={setEditLessonVideos} />
                                  <div className="flex gap-2">
                                    <button onClick={saveEditLesson} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>Сохранить</button>
                                    <button onClick={() => setEditingLessonId(null)} className="text-xs px-3 py-1.5" style={{ color: '#666', fontFamily: font.mono }}>Отмена</button>
                                  </div>
                                </div>
                              )}
                            </SortableLessonItem>
                          ))}
                        </SortableContext>
                      </DndContext>

                      {showAddLesson === c.id ? (
                        <div className="space-y-2 pt-2">
                          <input placeholder="Название занятия" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="w-full px-3 py-2 rounded border text-xs" style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                          <textarea placeholder="Описание" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                            className="w-full px-3 py-2 rounded border text-xs" rows={2} style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }} />
                          <VideoBlockEditor videos={lessonVideos} onChange={setLessonVideos} />
                          <div className="flex gap-2">
                            <button onClick={() => addLesson(c.id)} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono }}>Добавить</button>
                            <button onClick={() => { setShowAddLesson(null); setLessonVideos([]); }} className="text-xs px-3 py-1.5" style={{ color: '#666', fontFamily: font.mono }}>Отмена</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setShowAddLesson(c.id); setLessonVideos([]); }}
                          className="flex items-center gap-1 text-xs mt-1"
                          style={{ color: '#4a8a4a', fontFamily: font.mono }}
                        >
                          <Plus size={12} /> Добавить занятие
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </SortableCourseItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ========= STUDENTS TAB ========= */
function StudentsTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    setProfiles(p.data || []);
    setRoles(r.data || []);
  };

  useEffect(() => { load(); }, []);

  const getRole = (uid: string) => roles.find(r => r.user_id === uid)?.role || 'student';

  return (
    <div>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Ученики</h2>

      <div className="space-y-2">
        {profiles.map(p => (
          <div
            key={p.user_id}
            className="rounded-lg border px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition"
            style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}
            onClick={() => navigate(`/school/admin/students/${p.user_id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-sm flex items-center gap-2" style={{ fontFamily: font.mono, color: '#e8e0d0' }}>
                  {p.full_name || p.email}
                  {p.is_blocked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#8a4a4a22', color: '#c45050', fontFamily: font.mono }}>
                      заблокирован
                    </span>
                  )}
                </span>
                {p.full_name && (
                  <span className="text-[11px] block" style={{ fontFamily: font.mono, color: '#555' }}>{p.email}</span>
                )}
              </div>
              <span className="text-[11px] flex-shrink-0" style={{ fontFamily: font.mono, color: getRole(p.user_id) === 'admin' ? '#4a8a4a' : '#555' }}>
                {getRole(p.user_id)}
              </span>
            </div>
          </div>
        ))}
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
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Ученик</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Программа</th>
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
                  {a.expires_at ? (() => {
                    const daysLeft = Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
                    return `${new Date(a.expires_at).toLocaleDateString('ru')} (${daysLeft > 0 ? `${daysLeft} дн.` : 'истёк'})`;
                  })() : '∞'}
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

/* ========= INVITE CODES TAB ========= */
interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  is_single_use: boolean;
  expires_in_days: number | null;
  used: boolean;
  used_by: string | null;
  created_at: string;
  used_at: string | null;
  course_ids: string[];
}

function InviteCodesTab() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [expiresDays, setExpiresDays] = useState(30);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const load = async () => {
    const [c, p, cr] = await Promise.all([
      supabase.from('invite_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('courses').select('*').order('sort_order'),
    ]);
    setCodes((c.data || []) as InviteCode[]);
    setProfiles(p.data || []);
    const courseList = (cr.data || []) as Course[];
    setCourses(courseList);
    if (selectedCourseIds.length === 0 && courseList.length > 0) {
      const nonFree = courseList.find(c => !c.is_free);
      if (nonFree) setSelectedCourseIds([nonFree.id]);
    }
  };

  useEffect(() => { load(); }, []);

  const getEmail = (uid: string | null) => {
    if (!uid) return '—';
    return profiles.find(p => p.user_id === uid)?.email || uid;
  };

  const getCourseNames = (cids: string[]) => {
    if (!cids || cids.length === 0) return '—';
    return cids.map(id => courses.find(c => c.id === id)?.title || '—').join(', ');
  };

  const toggleCourseSelection = (id: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const generateCode = async () => {
    if (!user || selectedCourseIds.length === 0) return;
    setGenerating(true);
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    const code = Array.from(array).map(b => b.toString(36).padStart(2, '0')).join('').toUpperCase().substring(0, 8);
    await supabase.from('invite_codes').insert({
      code,
      created_by: user.id,
      is_single_use: true,
      expires_in_days: expiresDays || null,
      course_ids: selectedCourseIds,
    } as any);
    setGenerating(false);
    load();
  };

  const deleteCode = async (id: string) => {
    await supabase.from('invite_codes').delete().eq('id', id);
    setCodes(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg" style={{ fontFamily: font.heading }}>Инвайт-коды</h2>
      </div>

      <div className="rounded-lg border p-4 mb-4 flex flex-wrap items-end gap-3" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
        <div>
          <label className="block text-[10px] mb-1" style={{ color: '#666', fontFamily: font.mono }}>Программы</label>
          <div className="flex flex-wrap gap-2">
            {courses.filter(c => !c.is_free).map(c => (
              <button
                key={c.id}
                onClick={() => toggleCourseSelection(c.id)}
                className="px-3 py-1.5 rounded border text-xs transition-all"
                style={{
                  backgroundColor: selectedCourseIds.includes(c.id) ? '#4a8a4a' : '#111',
                  borderColor: selectedCourseIds.includes(c.id) ? '#4a8a4a' : '#222',
                  color: '#e8e0d0',
                  fontFamily: font.mono,
                }}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] mb-1" style={{ color: '#666', fontFamily: font.mono }}>Срок (дней)</label>
          <input
            type="number"
            value={expiresDays}
            onChange={e => setExpiresDays(Number(e.target.value))}
            className="px-3 py-2 rounded border text-sm w-24"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono }}
          />
        </div>
        <button
          onClick={generateCode}
          disabled={generating || selectedCourseIds.length === 0}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono, opacity: generating ? 0.6 : 1 }}
        >
          <Plus size={14} /> Сгенерировать код
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: font.mono }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Код</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Программа</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Создан</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Срок</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Статус</th>
              <th className="text-left py-2 pr-4" style={{ color: '#666' }}>Использован</th>
              <th className="text-left py-2" style={{ color: '#666' }}></th>
            </tr>
          </thead>
          <tbody>
            {codes.map(c => {
              const expired = c.expires_in_days
                ? new Date(c.created_at).getTime() + c.expires_in_days * 86400000 < Date.now()
                : false;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #111' }}>
                  <td className="py-2.5 pr-4">
                    <span
                      onClick={() => copyCode(c.code, c.id)}
                      className="cursor-pointer hover:opacity-70 transition-opacity"
                      style={{ color: '#e8e0d0', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {c.code}
                      {copiedId === c.id && <span className="ml-2 text-[10px]" style={{ color: '#4a8a4a' }}>Скопировано</span>}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: '#999' }}>{getCourseNames(c.course_ids)}</td>
                  <td className="py-2.5 pr-4" style={{ color: '#666' }}>{new Date(c.created_at).toLocaleDateString('ru')}</td>
                  <td className="py-2.5 pr-4" style={{ color: '#666' }}>{c.expires_in_days ? `${c.expires_in_days} дн.` : '∞'}</td>
                  <td className="py-2.5 pr-4" style={{ color: c.used ? '#666' : expired ? '#e85d3a' : '#4a8a4a' }}>
                    {c.used ? 'Использован' : expired ? 'Истёк' : 'Активен'}
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: '#666' }}>{getEmail(c.used_by)}</td>
                  <td className="py-2.5">
                    <button onClick={() => deleteCode(c.id)} className="hover:opacity-70">
                      <Trash2 size={12} style={{ color: '#666' }} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {codes.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center" style={{ color: '#444' }}>Нет инвайт-кодов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
