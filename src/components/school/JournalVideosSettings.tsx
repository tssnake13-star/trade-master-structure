import { useEffect, useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  JOURNAL_VIDEOS_KEY,
  mondayOf,
  nextTitle,
  parseJournalVideos,
  weekLabel,
  youTubeId,
  type JournalVideo,
} from '@/lib/journalVideos';

/**
 * «Админ-панель → Разборы допусков» — его слово 25.09.2026: «чтобы я мог это делать сам через админ-панель…
 * добавлял видео именно в журнал решений Сергея». Серия сериала «Допуск-отказ»: ссылка, название и неделя,
 * которую она разбирает. В терминале серия встаёт над журналом и над карточками своей недели.
 */
const font = "'Hanken Grotesk', sans-serif";
const input = { backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font } as const;

export default function JournalVideosSettings() {
  const [items, setItems] = useState<JournalVideo[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  // серия выходит на выходных и разбирает прошедшую неделю — по умолчанию прошлая неделя
  const [week, setWeek] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return mondayOf(d);
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchList = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', JOURNAL_VIDEOS_KEY).maybeSingle();
    return parseJournalVideos(data?.value);
  };

  useEffect(() => {
    fetchList().then((l) => {
      setItems(l);
      setTitle(nextTitle(l));
    });
  }, []);

  // список перечитывается перед каждой правкой: если серии добавили в другом окне, они не потеряются
  const change = async (fn: (cur: JournalVideo[]) => JournalVideo[]) => {
    setBusy(true);
    setErr(null);
    const next = fn(await fetchList());
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: JOURNAL_VIDEOS_KEY, value: JSON.stringify(next), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setBusy(false);
    if (error) {
      setErr(`Не сохранилось: ${error.message}`);
      return null;
    }
    const l = parseJournalVideos(JSON.stringify(next));
    setItems(l);
    return l;
  };

  const add = async () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) {
      setErr('Вставь ссылку на видео, она начинается с https://');
      return;
    }
    const monday = mondayOf(new Date(`${week}T12:00:00`));
    const l = await change((cur) => [
      { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title: title.trim() || nextTitle(cur), url: u, week: monday, added: new Date().toISOString() },
      ...cur,
    ]);
    if (l) {
      setUrl('');
      setTitle(nextTitle(l));
      setMsg('Добавлено ✓ — уже в журнале решений');
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const remove = async (v: JournalVideo) => {
    if (!window.confirm(`Убрать «${v.title}» из журнала решений?`)) return;
    await change((cur) => cur.filter((x) => x.id !== v.id));
  };

  const yt = url.trim() ? youTubeId(url.trim()) : null;
  const monday = week ? mondayOf(new Date(`${week}T12:00:00`)) : '';

  return (
    <div>
      <h2 className="text-lg mb-1" style={{ fontFamily: font }}>Разборы допусков</h2>
      <p className="text-[12px] mb-4 leading-relaxed" style={{ color: '#888', fontFamily: font }}>
        Серии «Допуск-отказ» для журнала решений в терминале. Серия встаёт над журналом и над карточками недели, которую
        она разбирает. Ссылка YouTube встраивается плеером, другая ссылка — кнопкой «смотреть».
      </p>

      <div className="rounded-lg border p-4 space-y-3 mb-6" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#999', fontFamily: font }}>Ссылка на видео</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" className="w-full px-3 py-2 rounded border text-sm" style={input} />
          {url.trim() ? (
            <p className="text-[11px] mt-1" style={{ color: yt ? '#4a8a4a' : '#caa472', fontFamily: font }}>
              {yt ? 'YouTube — в журнале будет плеер' : 'Не YouTube — в журнале будет кнопка «смотреть»'}
            </p>
          ) : null}
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#999', fontFamily: font }}>Название</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border text-sm" style={input} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#999', fontFamily: font }}>Какую неделю разбирает — любой день этой недели</label>
          <input type="date" value={week} onChange={(e) => setWeek(e.target.value)} className="px-3 py-2 rounded border text-sm" style={input} />
          {monday ? (
            <span className="text-xs ml-3" style={{ color: '#caa472', fontFamily: font }}>неделя {weekLabel(monday)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={add} disabled={busy} className="text-xs px-4 py-2 rounded" style={{ backgroundColor: '#4a8a4a', color: '#e8e0d0', fontFamily: font, opacity: busy ? 0.6 : 1 }}>
            {busy ? '...' : 'Добавить в журнал'}
          </button>
          {msg ? <span className="text-xs" style={{ color: '#4a8a4a', fontFamily: font }}>{msg}</span> : null}
          {err ? <span className="text-xs" style={{ color: '#d06666', fontFamily: font }}>{err}</span> : null}
        </div>
      </div>

      <h3 className="text-sm mb-2" style={{ fontFamily: font, color: '#caa472' }}>В журнале — {items.length}</h3>
      <div className="space-y-2">
        {items.map((v) => (
          <div key={v.id} className="rounded-lg border px-3 py-2 flex items-center gap-3 flex-wrap" style={{ borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' }}>
            <span className="text-sm" style={{ fontFamily: font, color: '#e8e0d0' }}>{v.title}</span>
            <span className="text-xs" style={{ fontFamily: font, color: '#888' }}>неделя {weekLabel(v.week)}</span>
            <span className="text-[11px]" style={{ fontFamily: font, color: youTubeId(v.url) ? '#4a8a4a' : '#caa472' }}>
              {youTubeId(v.url) ? 'YouTube' : 'ссылка'}
            </span>
            <a href={v.url} target="_blank" rel="noreferrer" className="ml-auto hover:opacity-70" title="Открыть видео">
              <ExternalLink size={14} style={{ color: '#888' }} />
            </a>
            <button onClick={() => remove(v)} disabled={busy} className="hover:opacity-70" title="Убрать из журнала">
              <Trash2 size={14} style={{ color: '#d06666' }} />
            </button>
          </div>
        ))}
        {!items.length ? (
          <p className="text-xs" style={{ color: '#666', fontFamily: font }}>Серий в журнале пока нет.</p>
        ) : null}
      </div>
    </div>
  );
}
