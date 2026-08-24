import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Управление баннерами кабинета из админки, без правки кода.
 *
 * ⚠️ Отсчёт потока перезапускается ТОЛЬКО руками, после того как поток реально
 * стартовал: автоматический перенос на новую дату превращает настоящий срок
 * в фальшивую срочность. Остаток мест показывается лишь начиная с порога —
 * «свободно 10 из 10» читается как «не купил никто».
 */

const font = {
  heading: "'Syne', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
};

const KEYS = [
  'banner_stream_enabled',
  'banner_stream_date',
  'banner_stream_seats',
  'banner_stream_taken',
  'banner_stream_threshold',
  'banner_stream_hide_courses',
  'banner_upgrade_enabled',
  'banner_upgrade_course_id',
];

const inputStyle: React.CSSProperties = { backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono };
const labelStyle: React.CSSProperties = { color: '#999', fontFamily: font.mono };
const hintStyle: React.CSSProperties = { color: '#666', fontFamily: font.mono };

export default function BannersSettings({ courses }: { courses: { id: string; title: string }[] }) {
  const [v, setV] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('key, value').like('key', 'banner_%').then(({ data }) => {
      const map: Record<string, string> = {};
      for (const row of (data || []) as { key: string; value: string }[]) map[row.key] = row.value;
      setV(map);
    });
  }, []);

  const set = (k: string, val: string) => setV(prev => ({ ...prev, [k]: val }));

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    await Promise.all(KEYS.map(k =>
      supabase.from('site_settings').upsert({ key: k, value: v[k] ?? '', updated_at: now }, { onConflict: 'key' })
    ));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const seats = parseInt(v.banner_stream_seats || '10', 10) || 10;
  const taken = parseInt(v.banner_stream_taken || '0', 10) || 0;
  const threshold = parseInt(v.banner_stream_threshold || '3', 10) || 3;
  const startsAt = (v.banner_stream_date || '').trim();
  const started = startsAt
    ? new Date(`${startsAt}T00:00:00`).getTime() < new Date().setHours(0, 0, 0, 0)
    : false;
  const hideIds = (v.banner_stream_hide_courses || '').split(',').map(x => x.trim()).filter(Boolean);

  return (
    <>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Баннеры в кабинете</h2>
      <div className="rounded-lg border p-4 space-y-5 mb-6" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>

        {/* ---- набор в поток ---- */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#e8e0d0', fontFamily: font.mono }}>
            <input
              type="checkbox"
              checked={v.banner_stream_enabled === '1'}
              onChange={e => set('banner_stream_enabled', e.target.checked ? '1' : '0')}
            />
            Баннер «Ближайший поток практикума»
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Дата старта</label>
              <input type="date" value={startsAt} onChange={e => set('banner_stream_date', e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Всего мест</label>
              <input type="number" min={1} value={v.banner_stream_seats ?? '10'} onChange={e => set('banner_stream_seats', e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Занято</label>
              <input type="number" min={0} value={v.banner_stream_taken ?? '0'} onChange={e => set('banner_stream_taken', e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={labelStyle}>Порог показа мест</label>
              <input type="number" min={0} value={v.banner_stream_threshold ?? '3'} onChange={e => set('banner_stream_threshold', e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm" style={inputStyle} />
            </div>
          </div>

          <p className="text-[11px] leading-relaxed" style={hintStyle}>
            {started
              ? 'Дата уже прошла, баннер скрыт. Поставьте дату следующего потока, когда он будет назначен.'
              : taken >= threshold
                ? `Ученики видят: «Осталось ${Math.max(0, seats - taken)} из ${seats}».`
                : `Ученики видят: «Беру ${seats} человек». Остаток появится, когда занято будет ${threshold} и больше.`}
          </p>
          <p className="text-[11px] leading-relaxed" style={hintStyle}>
            После даты старта баннер гаснет сам. Новый отсчёт запускается только здесь, руками, когда поток действительно стартовал.
          </p>

          <div>
            <label className="block text-xs mb-1" style={labelStyle}>Не показывать тем, у кого есть доступ к курсам</label>
            <div className="flex flex-wrap gap-3">
              {courses.map(c => (
                <label key={c.id} className="flex items-center gap-1.5 text-[11px]" style={{ color: '#999', fontFamily: font.mono }}>
                  <input
                    type="checkbox"
                    checked={hideIds.includes(c.id)}
                    onChange={e => {
                      const next = e.target.checked ? [...hideIds, c.id] : hideIds.filter(x => x !== c.id);
                      set('banner_stream_hide_courses', next.join(','));
                    }}
                  />
                  {c.title}
                </label>
              ))}
            </div>
            <p className="text-[11px] mt-1.5 leading-relaxed" style={hintStyle}>
              Отметьте практикум и программы выше: тем, кто их уже купил, звать на поток незачем.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a' }} />

        {/* ---- зачёт оплаченного ---- */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm" style={{ color: '#e8e0d0', fontFamily: font.mono }}>
            <input
              type="checkbox"
              checked={v.banner_upgrade_enabled === '1'}
              onChange={e => set('banner_upgrade_enabled', e.target.checked ? '1' : '0')}
            />
            Баннер «Зачёт оплаченного», 30 дней после покупки
          </label>
          <div>
            <label className="block text-xs mb-1" style={labelStyle}>Курс, покупка которого включает отсчёт</label>
            <select
              value={v.banner_upgrade_course_id || ''}
              onChange={e => set('banner_upgrade_course_id', e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm"
              style={inputStyle}
            >
              <option value="">Не выбран</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <p className="text-[11px] mt-1.5 leading-relaxed" style={hintStyle}>
              Это Trade System. Отсчёт у каждого свой: 30 дней с даты выдачи доступа. После срока баннер исчезает и не возвращается.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs px-4 py-2 rounded"
            style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '...' : 'Сохранить баннеры'}
          </button>
          {saved && <span className="text-xs" style={{ color: '#4a8a4a', fontFamily: font.mono }}>Сохранено ✓</span>}
        </div>
      </div>
    </>
  );
}
