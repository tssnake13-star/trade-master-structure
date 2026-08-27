import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Удаление неактивных бесплатных аккаунтов — управление и список кандидатов.
 *
 * ⚠️ Удаление необратимо: уходят профиль, прогресс и сама учётная запись.
 * Поэтому список тех, кого удалит ближайшая ночная чистка, виден здесь ДО
 * удаления, а сам механизм включается галочкой осознанно.
 *
 * Под чистку не попадают: аккаунты с проставленным тарифом, с любым доступом
 * к курсам, с использованным инвайт-кодом, админы и супер-админ.
 */

const font = {
  heading: "'Syne', system-ui, sans-serif",
  mono: "'Space Mono', ui-monospace, monospace",
};

type Candidate = {
  user_id: string;
  email: string;
  full_name: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export default function InactivePurgeSettings() {
  const [enabled, setEnabled] = useState(false);
  const [days, setDays] = useState('14');
  const [list, setList] = useState<Candidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const loadAll = async () => {
    setLoadingList(true);
    const [{ data: settings }, { data: candidates }] = await Promise.all([
      supabase.from('site_settings').select('key, value').like('key', 'purge_%'),
      supabase.rpc('inactive_free_accounts'),
    ]);
    const map: Record<string, string> = {};
    for (const row of (settings || []) as { key: string; value: string }[]) map[row.key] = row.value;
    setEnabled(map.purge_inactive_enabled === '1');
    setDays(map.purge_inactive_days || '14');
    setList((candidates as Candidate[]) || []);
    setLoadingList(false);
  };

  useEffect(() => { loadAll(); }, []);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('site_settings').upsert({ key: 'purge_inactive_enabled', value: enabled ? '1' : '0', updated_at: now }, { onConflict: 'key' }),
      supabase.from('site_settings').upsert({ key: 'purge_inactive_days', value: days || '14', updated_at: now }, { onConflict: 'key' }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadAll();
  };

  const daysIdle = (c: Candidate) => {
    const base = new Date(c.last_seen_at || c.created_at);
    return Math.floor((Date.now() - base.getTime()) / 86400000);
  };

  return (
    <>
      <h2 className="text-lg mb-4" style={{ fontFamily: font.heading }}>Чистка неактивных</h2>
      <div className="rounded-lg border p-4 space-y-4 mb-6" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
        <label className="flex items-center gap-2 text-sm" style={{ color: '#e8e0d0', fontFamily: font.mono }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          Удалять неоплаченные аккаунты без активности
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#999', fontFamily: font.mono }}>Срок неактивности, дней</span>
          <input
            type="number"
            min={1}
            value={days}
            onChange={e => setDays(e.target.value)}
            className="px-3 py-2 rounded border text-sm"
            style={{ backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono, width: 90 }}
          />
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: '#666', fontFamily: font.mono }}>
          Чистка идёт ночью, раз в сутки. Не трогает тех, у кого проставлен тариф, есть любой доступ
          к курсам, использован инвайт-код, а также админов. Удаление необратимо: уходят профиль,
          прогресс и учётная запись.
        </p>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 14 }}>
          <div className="text-xs mb-2" style={{ color: '#999', fontFamily: font.mono }}>
            {loadingList ? 'Считаю…' : `Под удаление сейчас попадает: ${list.length}`}
          </div>
          {list.length > 0 && (
            <div className="space-y-1.5">
              {list.map(c => (
                <div key={c.user_id} className="flex items-center justify-between gap-3 text-[11px]" style={{ fontFamily: font.mono }}>
                  <span style={{ color: '#a8a090' }}>{c.full_name || c.email}</span>
                  <span style={{ color: '#666' }}>{c.full_name ? c.email : ''}</span>
                  <span style={{ color: '#c45050', flexShrink: 0 }}>{daysIdle(c)} дн. без входа</span>
                </div>
              ))}
            </div>
          )}
          {!loadingList && list.length === 0 && (
            <p className="text-[11px]" style={{ color: '#4a4a4a', fontFamily: font.mono }}>Кандидатов нет.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs px-4 py-2 rounded"
            style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font.mono, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '...' : 'Сохранить'}
          </button>
          {saved && <span className="text-xs" style={{ color: '#4a8a4a', fontFamily: font.mono }}>Сохранено ✓</span>}
        </div>
      </div>
    </>
  );
}
