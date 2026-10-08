import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import '@/styles/v3-skin.css';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackPageview, trackClick } from '@/lib/analytics';
import StructureField from '@/components/landing/StructureField';
import PackageCards from '@/components/landing/PackageCards';
import TwoPathsScheme from '@/components/landing/TwoPathsScheme';
import ProofStrip from '@/components/landing/ProofStrip';
import FiveStagesSection from '@/components/landing/FiveStagesSection';
import PurchaseFAQ from '@/components/landing/PurchaseFAQ';
import RouteChooser from '@/components/landing/RouteChooser';

/**
 * /access — private pricing page. NOT linked from anywhere on the site and not
 * in any navigation. Reachable only by direct URL (handed out via the Telegram
 * bot / video descriptions). Same v3 visual language as the landing.
 *
 * 08.10.2026: страница двухэтажная. Наверху RouteChooser (слоган, формула, четыре маршрута)
 * и карточки, ниже схема, доказательства, этапы и вопросы. Прежний порядок 06.09.2026: шапка → бесплатный вердикт →
 * где вы сейчас → доказательства → пять этапов → карточки и экосистема →
 * вопросы перед оплатой → заявка. 07.10.2026 «где вы сейчас» заменено
 * схемой «вход и два пути» (TwoPathsScheme), здесь она со всеми ценами.
 */
export default function Access() {
  // страница цен — считаем отдельно от лендинга: сюда приходят из бота, и важно
  // видеть, сколько дошло до цен и кто нажал «оформить»
  useEffect(() => { trackPageview('/access'); }, []);
  // свой заголовок вкладки: по нему и ИИ-читатели понимают, что это страница цен (05.10.2026)
  useEffect(() => {
    const prev = document.title;
    document.title = 'Цены и условия — TRADELIKETYO';
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="landing-skin v3-skin min-h-screen relative" style={{ background: 'var(--v3-bg, hsl(var(--background)))', color: 'hsl(var(--foreground))' }}>
      <StructureField position="fixed" opacity={0.45} zIndex={0} mask="radial-gradient(150% 120% at 50% 32%, #000 45%, transparent 92%)" />

      <main className="relative" style={{ zIndex: 2 }}>
        <section className="container-landing pt-14 md:pt-20 pb-12 md:pb-20">
          {/* Верхний этаж (08.10.2026): за 10 секунд понятно, что выбрать. Слоган с честной строкой,
              формула ECHO-GATE с вердиктом и четыре маршрута, каждый ведёт к своей карточке. */}
          <RouteChooser />

          <div className="mt-12 md:mt-16">
            <PackageCards showPrices={true} ctaHref={TELEGRAM_LINKS.dm} choiceNote="bottom" />
          </div>

          {/* Нижний этаж: доказательства и глубина для тех, кто хочет разобраться */}
          <div className="mt-16 md:mt-24">
            <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>Для тех, кто хочет разобраться</span>
            <h2 className="text-foreground" style={{ fontSize: 'clamp(30px, 4vw, 52px)', lineHeight: 1.02 }}>
              Два пути. <em>Один алгоритм.</em>
            </h2>
          </div>

          {/* Бесплатный вход — первый узел схемы, отдельной карточки вердикта
              больше нет (Сергей 07.10.2026: «убери одно»). Полный текст и три
              условия разбора живут внутри схемы (detailedEntry). */}
          <div className="mt-8 md:mt-10">
            <TwoPathsScheme showPrices={true} detailedEntry entryClickId="access_razbor" />
          </div>

          <div className="mt-10 md:mt-14">
            <ProofStrip />
          </div>

          <div className="mt-12 md:mt-16">
            <FiveStagesSection showPrices={true} asSection={false} />
          </div>

          {/* вопросы перед оплатой */}
          <PurchaseFAQ />

          {/* CTA */}
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('access_apply')}
              className="btn-primary group text-base md:text-lg"
            >
              Написать Сергею
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm text-muted-foreground">
              Каждую заявку разбираю лично. Если вам ко мне пока рано, скажу прямо ·{' '}
              <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                задать вопрос Сергею
              </a>
            </p>
          </div>
        </section>

        <footer className="relative border-t py-8 text-center" style={{ borderColor: 'hsl(var(--rule-soft))' }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground) / 0.6)' }}>
            TRADELIKETYO · 2026
          </span>
          {/* условия оплаты и возврата целиком — в соглашении (07.10.2026) */}
          <div
            className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground) / 0.8)' }}
          >
            <Link to="/terms" className="hover:text-foreground transition-colors">Пользовательское соглашение</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
