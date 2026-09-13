import { ArrowRight, ArrowDown } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';
import heroAuthorFallback from '@/assets/hero-author.jpg';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';
import StructureField from '@/components/landing/StructureField';

/**
 * HeroSectionV3 — первый экран лендинга в стиле v3 «editorial terminal».
 *
 * ⚠️ Текст переписан 13.09.2026 под «ПОРТРЕТ КЛИЕНТА.md». Задача экрана одна:
 * за три секунды человек понимает, для него это или нет.
 *   · заголовок бьёт в образ жизни (торгует рядом с работой), а не в общую
 *     боль «теряете на эмоциях» — её узнают и скальперы, и новички, а они
 *     не клиенты;
 *   · строка распорядка — факты из FAQ автора (выходные 30–60 минут,
 *     в будни короткая проверка). «Не нужно смотреть на график» НЕ обещаем:
 *     проверка в будни есть;
 *   · строка-фильтр отсекает интрадей сознательно: сейчас этот отсев стоит
 *     Сергею дней переписки в личке.
 *
 * Главная кнопка — бот: по аналитике 14.08–13.09 это единственная кнопка
 * лендинга, которую нажимают (17 из 132 живых посетителей). Вердикт вторым
 * действием: 6 из 10 заходят с телефона, а вердикт просит скрин с компьютера.
 * Метки кликов hero_bot и hero_scroll_verdict не менять — по ним сравниваем
 * конверсию до и после.
 */

/**
 * Заголовок — ровно две строки, и ни одна не ломается внутри (white-space: nowrap).
 * Сергей 13.09.2026: «в выходные» и «В будни только исполнение» должны стоять
 * целиком, без висящего предлога и без «исполнение» на отдельной строке.
 * Размер каждой строки считается от ширины колонки в v3-skin.css (.v3h-line1/2):
 * замер Cormorant 500 — «Решение — в выходные.» = 8,77 em,
 * «В будни только исполнение.» = 11,03 em. Вторая строка на 18% мельче.
 */
const LINE1: { t: string; em?: boolean }[] = [
  { t: 'Решение' }, { t: '—' }, { t: 'в' }, { t: 'выходные.', em: true },
];
const LINE2: { t: string }[] = [
  { t: 'В' }, { t: 'будни' }, { t: 'только' }, { t: 'исполнение.' },
];

const OFFER: { t: string; cls?: 'gold' | 'mute' | 'uline' }[] = [
  { t: 'Для тех, кто торгует рядом с ' },
  { t: 'основной работой', cls: 'uline' },
  { t: ' и не может сидеть у графика. Какую сделку брать, решает ' },
  { t: 'алгоритм', cls: 'gold' },
  { t: ', а не настроение в моменте.' },
];

const MONO_SMALL: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' };

export default function HeroSectionV3() {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);

  return (
    <section id="hero" className="v3h relative min-h-[100svh] flex flex-col justify-start lg:justify-center pt-16 md:pt-20 pb-12 md:pb-16" style={{ overflowX: 'clip' }}>
      {/* abstract market-structure field (nodes + levels) */}
      <StructureField />

      {/* author photo flush to the right edge (desktop ≥lg only) */}
      <div className="v3h-photo absolute top-0 right-0 h-full w-[52%] hidden lg:block" style={{ zIndex: 1 }}>
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
      </div>

      {/* HUD corner code (hidden below lg to avoid the header logo) */}
      <div className="v3h-hud absolute hidden lg:block" style={{ top: 22, left: 22, zIndex: 3, lineHeight: 1.5 }}>
        8V8<br />01
      </div>

      {/* фото для телефона и планшета. Ниже, чем было (48vh → 38vh): под заголовком
          теперь строка распорядка и фильтр, а кнопка должна остаться близко к первому
          экрану — с телефона приходит 6 человек из 10. */}
      <div className="lg:hidden relative w-full mb-6 -mt-16" style={{ height: '38vh', zIndex: 1 }}>
        <img
          src={heroAuthor}
          alt="Сергей — автор системы TRADELIKETYO"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 6%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--v3-bg) 0%, transparent 20%, transparent 66%, var(--v3-bg) 96%)' }} />
      </div>

      {/* text */}
      {/* w-full обязателен: секция — flex-колонка, и без него контейнер сжимается
          под ширину содержимого, а колонка заголовка (56%) становится узкой */}
      <div className="container-landing relative w-full" style={{ zIndex: 2 }}>
        <div className="w-full lg:max-w-[56%]">
          <div className="v3h-eyebrow v3h-mono mb-7">
            <span className="dot" /> Свинг-трейдинг · неделя и дневка
          </div>

          <h1 className="v3h-h1">
            <span className="v3h-line v3h-line1">
              {LINE1.map((w, i) => (
                <span key={i}>
                  <span className="word" style={{ animationDelay: `${i * 0.08}s` }}>
                    {w.em ? <em>{w.t}</em> : w.t}
                  </span>{i < LINE1.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
            <span className="v3h-line v3h-line2">
              {LINE2.map((w, i) => (
                <span key={i}>
                  <span className="word mute" style={{ animationDelay: `${(LINE1.length + i) * 0.08}s` }}>
                    {w.t}
                  </span>{i < LINE2.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
          </h1>

          <p className="v3h-offer mt-9">
            {OFFER.map((s, i) => (
              <span key={i} className={s.cls}>{s.t}</span>
            ))}
          </p>

          {/* распорядок: факты, а не обещание */}
          <p className="v3h-mono mt-6" style={{ ...MONO_SMALL, opacity: 0.8 }}>
            Разбор рынка раз в неделю, 30–60 минут · в будни короткая проверка
          </p>

          {/* фильтр: отсекает интрадей до лички */}
          <p
            className="mt-4 text-sm md:text-base"
            style={{ color: 'var(--v3-mut)', borderLeft: '2px solid var(--v3-gold-dim)', paddingLeft: 12, maxWidth: '46ch' }}
          >
            Если вам нужен рынок каждый день и движение внутри часа — вам не сюда.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href={TELEGRAM_LINKS.bot} target="_blank" rel="noopener noreferrer" className="v3h-btn v3h-btn--solid" onClick={() => trackClick('hero_bot')}>
              {/* на телефоне полная надпись переносится на две строки — там короче */}
              <span className="hidden sm:inline">Получить бесплатный протокол</span>
              <span className="sm:hidden">Получить протокол</span>
              <ArrowRight className="arr w-4 h-4" />
            </a>
            <a href="#verdict" className="v3h-btn v3h-btn--ghost" onClick={() => trackClick('hero_scroll_verdict')}>
              <ArrowDown className="w-4 h-4" /> Вердикт по вашей сделке
            </a>
          </div>

          {/* что будет после клика */}
          <p className="v3h-mono mt-6" style={{ ...MONO_SMALL, opacity: 0.55 }}>
            Бесплатно · Telegram-бот · 3 вопроса о вашей торговле · без звонков
          </p>

          {/* ранний сигнал доверия — факты из журнала, якорь к результатам */}
          <a
            href="#stats"
            className="v3h-mono mt-3 inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
            style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            14 лет в рынке · 377 сделок в журнале за 20 месяцев
            <ArrowRight className="arr w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
