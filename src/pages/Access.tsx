import { ArrowRight } from 'lucide-react';
import '@/styles/v3-skin.css';
import { TELEGRAM_LINKS } from '@/lib/constants';
import StructureField from '@/components/landing/StructureField';
import PackageCards from '@/components/landing/PackageCards';

/**
 * /access — private pricing page. NOT linked from anywhere on the site and not
 * in any navigation. Reachable only by direct URL (handed out via the Telegram
 * bot / video descriptions). Same v3 visual language as the landing.
 */
export default function Access() {
  return (
    <div className="landing-skin v3-skin min-h-screen relative" style={{ background: 'var(--v3-bg, hsl(var(--background)))', color: 'hsl(var(--foreground))' }}>
      <StructureField position="fixed" opacity={0.45} zIndex={0} mask="radial-gradient(150% 120% at 50% 32%, #000 45%, transparent 92%)" />

      <main className="relative" style={{ zIndex: 2 }}>
        <section className="container-landing pt-20 md:pt-28 pb-12 md:pb-20">
          <div className="max-w-3xl">
            <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>TLT · Доступ · цены и условия</span>
            <h1 className="text-foreground" style={{ fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 0.98 }}>
              Форматы <em>и цены</em>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
              Система, которая остаётся с вами. Выберите уровень — от алгоритма принятия решений
              до полной инфраструктуры с автоисполнением и защитой капитала.
            </p>
          </div>

          {/* для сомневающихся: вход через бесплатный разбор — перед ценами */}
          <a
            href={TELEGRAM_LINKS.razbor}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-start justify-between gap-4 max-w-2xl border border-border rounded-xl bg-card/60 p-5 hover:border-muted-foreground/50 transition-colors group"
          >
            <div>
              <div className="text-foreground font-medium">Не готовы решать — начните с вердикта</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Пришлите 3 свои сделки — бесплатный личный видеоразбор через систему допуска.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(var(--accent))' }} />
          </a>

          <div className="mt-10 md:mt-14">
            <PackageCards showPrices={true} ctaHref={TELEGRAM_LINKS.dm} />
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-base md:text-lg"
            >
              Оставить заявку на обучение
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm text-muted-foreground">
              Места ограничены · набор закрывается в ближайшее воскресенье ·{' '}
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
        </footer>
      </main>
    </div>
  );
}
