import { Plus, Trash2 } from 'lucide-react';

const font = { mono: "'JetBrains Mono', monospace" };
const inputStyle: React.CSSProperties = { backgroundColor: '#111', borderColor: '#222', color: '#e8e0d0', fontFamily: font.mono };

interface VideoItem {
  id?: string;
  title: string;
  video_url: string;
  video_url_alt: string;
  sort_order: number;
}

interface Props {
  videos: VideoItem[];
  onChange: (videos: VideoItem[]) => void;
}

export default function VideoBlockEditor({ videos, onChange }: Props) {
  const add = () => {
    onChange([...videos, { title: `Часть ${videos.length + 1}`, video_url: '', video_url_alt: '', sort_order: videos.length }]);
  };

  const update = (i: number, field: keyof VideoItem, value: string | number) => {
    const next = [...videos];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const remove = (i: number) => {
    onChange(videos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: '#666', fontFamily: font.mono }}>Видео</p>
      {videos.map((v, i) => (
        <div key={i} className="rounded border p-3 space-y-2" style={{ borderColor: '#1a1a1a', backgroundColor: '#0a0a0a' }}>
          <div className="flex items-center justify-between">
            <input placeholder="Название (Часть 1)" value={v.title} onChange={e => update(i, 'title', e.target.value)}
              className="flex-1 px-2 py-1 rounded border text-xs" style={inputStyle} />
            <input type="number" placeholder="№" value={v.sort_order} onChange={e => update(i, 'sort_order', Number(e.target.value))}
              className="w-16 ml-2 px-2 py-1 rounded border text-xs text-center" style={inputStyle} />
            <button onClick={() => remove(i)} className="ml-2 hover:opacity-70"><Trash2 size={12} style={{ color: '#444' }} /></button>
          </div>
          <input placeholder="URL видео (YouTube)" value={v.video_url} onChange={e => update(i, 'video_url', e.target.value)}
            className="w-full px-2 py-1 rounded border text-xs" style={inputStyle} />
          <input placeholder="Ссылка для России (Дзен/RuTube)" value={v.video_url_alt} onChange={e => update(i, 'video_url_alt', e.target.value)}
            className="w-full px-2 py-1 rounded border text-xs" style={inputStyle} />
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-xs" style={{ color: '#4a8a4a', fontFamily: font.mono }}>
        <Plus size={12} /> Добавить видео
      </button>
    </div>
  );
}
