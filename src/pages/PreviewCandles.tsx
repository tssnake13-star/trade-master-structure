import { useState } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/v3-skin.css';
import CandleVariants, { type CandleVariant } from '@/components/preview-next/CandleVariants';

/**
 * /preview-candles — sandbox to compare candlestick hero-background animations.
 * Switch variants live; the sample headline shows each in hero context.
 * Production landing is untouched.
 */
const VARIANTS: { key: CandleVariant; label: string; note: string }[] = [
  { key: 'aura', label: '★ Атмосфера', note: 'Без чарта: мягкое золотое свечение медленно дрейфует за фото + еле заметная терминал-сетка. Тихая роскошь — типографика и фото в главной роли. Моя рекомендация.' },
  { key: 'structure', label: '★ Структура', note: 'Почти пусто: тонкие золотые линии соединяют редкие узлы (абстрактная «структура рынка») + горизонтальные «уровни». Минимализм, точность, прямо на бренд.' },
  { key: 'tape', label: 'Лента (текущая)', note: 'Свечи едут справа-налево, как живой тикер.' },
  { key: 'forming', label: 'Формирование', note: 'Волна «печатает» свечи слева-направо — график строится в реальном времени.' },
  { key: 'equity', label: 'Кривая роста', note: 'Свечи дышат + светящаяся equity-линия с бегущей точкой.' },
  { key: 'scan', label: 'Сканер', note: 'Статичные свечи + золотой скан-луч подсвечивает их при проходе.' },
  { key: 'parallax', label: 'Параллакс', note: 'Два слоя свечей с разной скоростью — ощущение глубины.' },
];

export default function PreviewCandles() {
  const [v, setV] = useState<CandleVariant>('aura');
  const note = VARIANTS.find(x => x.key === v)?.note ?? '';

  return (
    <div data-pn className="v3-skin min-h-screen text-foreground" style={{ background: 'var(--v3-bg, oklch(0.09 0.012 70))' }}>
      {/* toggle banner */}
      <div className="pn-banner" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span>Превью · Анимации свечей</span>
        <div className="flex items-center gap-2 flex-wrap">
          {VARIANTS.map(opt => (
            <button key={opt.key} className="pn-vbtn" data-active={v === opt.key} onClick={() => setV(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
        <Link to="/">← Боевой сайт</Link>
      </div>

      {/* hero-like stage */}
      <section className="v3h relative min-h-[88vh] flex items-center overflow-hidden">
        {/* key forces canvas remount so each variant re-seeds */}
        <CandleVariants key={v} variant={v} />

        <div className="container-landing relative" style={{ zIndex: 2 }}>
          <div className="w-full lg:max-w-[56%]">
            <div className="v3h-eyebrow v3h-mono mb-6">
              <span className="dot" /> TLT · Фон hero · {VARIANTS.find(x => x.key === v)?.label}
            </div>
            <h1 className="v3h-h1">
              Вы читаете <em>рынок.</em> <span className="mut">Но теряете на решениях.</span>
            </h1>
            <p className="v3h-offer mt-7">{note}</p>
          </div>
        </div>
      </section>

      <div className="container-landing py-10" style={{ position: 'relative', zIndex: 2 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VARIANTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setV(opt.key)}
              className="text-left p-5"
              style={{ border: '1px solid hsl(var(--rule-soft))', background: v === opt.key ? 'hsl(var(--secondary))' : 'transparent', borderColor: v === opt.key ? 'hsl(var(--pn-warm-dim))' : undefined }}
            >
              <div className="v3h-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'hsl(var(--pn-warm))' }}>{opt.label}</div>
              <div className="mt-2" style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>{opt.note}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
