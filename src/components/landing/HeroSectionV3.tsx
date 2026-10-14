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
 *
 * 11.10.2026: заголовок сменён на главное предложение «Попробуйте мою систему,
 * не изучая её» (весь сайт говорит об одном), вторая кнопка ведёт в «Неделю
 * по системе» (hero_scroll_week). Сравнивать с прежним: доля нажавших hero_trial.
 */

/**
 * Заголовок — ровно две строки, и ни одна не ломается внутри (white-space: nowrap).
 * Размер каждой строки считается от ширины колонки в v3-skin.css (.v3h-line1/2).
 *
 * 11.10.2026, Сергей: «весь сайт должен говорить об одном… попробуй мою систему, не изучая её.
 * Это первое касание». Прежний заголовок «Решение в выходные. В будни только исполнение»
 * (13.09.2026, по портрету) описывал неделю того, кто торгует сам, то есть второй путь.
 * Образ жизни остался строкой «Для тех, кто торгует рядом с основной работой» и фильтром.
 * Вторая строка золотым курсивом: «не изучая её» и есть отличие от всего, что он уже покупал.
 */
const LINE1: { t: string; em?: boolean }[] = [
  { t: 'Попробуйте' }, { t: 'мою' }, { t: 'систему,' },
];
const LINE2: { t: string; em?: boolean }[] = [
  { t: 'не', em: true }, { t: 'изучая', em: true }, { t: 'её.', em: true },
];

// 08.10.2026 «бинокль впереди»: под заголовком главное обещание школы (оффер, раздел 8),
// а главная кнопка зовёт в 7 дней терминала. Ведёт через бота (?start=trial): человек
// остаётся в базе, бот присылает регистрацию.
// 11.10.2026: «не изучая её» ушло в заголовок, здесь как устроено. Что видно в пробные 7 дней
// (журнал решений), сказано ниже: «Неделя по системе», схема входа, вопрос «Что я увижу за 7 бесплатных дней?».
// Сюда эту фразу не ставить: на телефоне кнопка уходит за первый экран (замер 11.10: 907 при высоте 844).
const OFFER: { t: string; cls?: 'gold' | 'mute' | 'uline' }[] = [
  { t: 'Терминал находит сделку, я даю вердикт, вы отмечаете точку входа и нажимаете ' },
  { t: 'СТАРТ', cls: 'gold' },
  { t: '. Дальше сделку ведёт ' },
  { t: 'советник', cls: 'uline' },
  { t: '.' },
];

const MONO_SMALL: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' };

export default function HeroSectionV3() {
  const heroAuthor = useSiteAsset(SITE_ASSET_KEYS.heroAuthor, heroAuthorFallback);

  // ⚠️ justify-start в секцию не возвращать: класс Tailwind грузится позже v3-skin.css
  // и перебивает .v3h-split-center — на компьютере текст встаёт по верху вместо середины
  // (поймано Сергеем 23.09.2026). Оба состояния выравнивания заданы в v3-skin.css.
  return (
    <section id="hero" className="v3h v3h-split-center relative min-h-[100svh] flex flex-col pt-16 md:pt-20 pb-12 md:pb-16" style={{ overflowX: 'clip' }}>
      {/* abstract market-structure field (nodes + levels) */}
      <StructureField />

      {/* фото у правого края. Показывается только в раскладке из двух колонок —
          условие в v3-skin.css (.v3h-split-*): шире 1024 И экран не вытянут вверх. */}
      <div className="v3h-photo v3h-split-photo absolute top-0 right-0 h-full w-[52%]" style={{ zIndex: 1 }}>
        <img src={heroAuthor} alt="Сергей — автор системы TRADELIKETYO" />
      </div>

      {/* HUD corner code (в раскладке стопкой на этом месте лежат фото и логотип) */}
      <div className="v3h-hud v3h-split-hud absolute" style={{ top: 22, left: 22, zIndex: 3, lineHeight: 1.5 }}>
        8V8<br />01
      </div>

      {/* фото для телефона и планшета.
          На телефоне высота прежняя, 38vh: кнопка должна остаться близко к первому экрану,
          с телефона приходит 6 человек из 10. На планшете 46–52vh: иначе от фигуры
          оставалась одна голова, обрезанная по шею. Кнопка там уходит ниже сгиба
          на треть экрана, но в шапке планшета своя кнопка бота, так что вход не теряется.
          Затемнение сверху укорочено до 12%, снизу начинается с 80%: прежние 20% и 66%
          съедали половину полосы и фигура растворялась в фоне. */}
      <div className="v3h-split-strip relative w-full mb-6 -mt-16 h-[38vh] sm:h-[46vh] md:h-[52vh]" style={{ zIndex: 1 }}>
        <img
          src={heroAuthor}
          alt="Сергей — автор системы TRADELIKETYO"
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 8%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--v3-bg) 0%, transparent 12%, transparent 80%, var(--v3-bg) 99%)' }} />
      </div>

      {/* text */}
      {/* w-full обязателен: секция — flex-колонка, и без него контейнер сжимается
          под ширину содержимого, а колонка заголовка (56%) становится узкой */}
      <div className="container-landing relative w-full" style={{ zIndex: 2 }}>
        <div className="w-full v3h-split-text">
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
                  <span className={w.em ? 'word' : 'word mute'} style={{ animationDelay: `${(LINE1.length + i) * 0.08}s` }}>
                    {w.em ? <em>{w.t}</em> : w.t}
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

          {/* для кого: портрет клиента одной строкой */}
          <p className="v3h-mono mt-6" style={{ ...MONO_SMALL, opacity: 0.8 }}>
            Для тех, кто торгует рядом с основной работой
          </p>

          {/* фильтр: отсекает интрадей до лички */}
          <p
            className="mt-4 text-sm md:text-base"
            style={{ color: 'var(--v3-mut)', borderLeft: '2px solid var(--v3-gold-dim)', paddingLeft: 12, maxWidth: '46ch' }}
          >
            Если вам нужен рынок каждый день и движение внутри часа, вам не сюда.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href={TELEGRAM_LINKS.trial} target="_blank" rel="noopener noreferrer" className="v3h-btn v3h-btn--solid" onClick={() => trackClick('hero_trial')}>
              {/* на телефоне полная надпись переносится на две строки — там короче */}
              <span className="hidden sm:inline">Попробовать терминал 7 дней</span>
              <span className="sm:hidden">Попробовать 7 дней</span>
              <ArrowRight className="arr w-4 h-4" />
            </a>
            {/* 11.10.2026: вторая кнопка ведёт в неделю подписчика, а не в вердикт:
                на первом экране одно предложение, вердикт остался своим блоком ниже */}
            <a href="#week" className="v3h-btn v3h-btn--ghost" onClick={() => trackClick('hero_scroll_week')}>
              <ArrowDown className="w-4 h-4" /> Как это устроено
            </a>
          </div>

          {/* что будет после клика */}
          <p className="v3h-mono mt-6" style={{ ...MONO_SMALL, opacity: 0.55 }}>
            Бесплатно · 7 дней · карта не нужна · через Telegram
          </p>

          {/* ранний сигнал доверия — факты из журнала, якорь к результатам */}
          <a
            href="#stats"
            className="v3h-mono mt-3 inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
            style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            15 лет в рынке · 387 сделок в журнале за 21 месяц
            <ArrowRight className="arr w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
