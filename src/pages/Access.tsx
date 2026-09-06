import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import '@/styles/v3-skin.css';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackPageview, trackClick } from '@/lib/analytics';
import StructureField from '@/components/landing/StructureField';
import PackageCards from '@/components/landing/PackageCards';
import WhereYouAreNow from '@/components/landing/WhereYouAreNow';
import ProofStrip from '@/components/landing/ProofStrip';
import FiveStagesSection from '@/components/landing/FiveStagesSection';
import PurchaseFAQ from '@/components/landing/PurchaseFAQ';

/**
 * /access — private pricing page. NOT linked from anywhere on the site and not
 * in any navigation. Reachable only by direct URL (handed out via the Telegram
 * bot / video descriptions). Same v3 visual language as the landing.
 *
 * Порядок блоков задан Сергеем 06.09.2026: шапка → бесплатный вердикт →
 * где вы сейчас → доказательства → пять этапов → карточки и экосистема →
 * вопросы перед оплатой → заявка.
 */
export default function Access() {
  // страница цен — считаем отдельно от лендинга: сюда приходят из бота, и важно
  // видеть, сколько дошло до цен и кто нажал «оформить»
  useEffect(() => { trackPageview('/access'); }, []);

  return (
    <div className="landing-skin v3-skin min-h-screen relative" style={{ background: 'var(--v3-bg, hsl(var(--background)))', color: 'hsl(var(--foreground))' }}>
      <StructureField position="fixed" opacity={0.45} zIndex={0} mask="radial-gradient(150% 120% at 50% 32%, #000 45%, transparent 92%)" />

      <main className="relative" style={{ zIndex: 2 }}>
        <section className="container-landing pt-20 md:pt-28 pb-12 md:pb-20">
          <div className="max-w-3xl">
            <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>TLT · Доступ · цены и условия</span>
            <h1 className="text-foreground" style={{ fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 0.98 }}>
              4 уровня. <em>Один алгоритм.</em>
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '58ch' }}>
              Алгоритм решает, какую сделку брать. Разница между уровнями в одном: сколько раз
              я стою рядом, когда вы это решение принимаете.
            </p>
          </div>

          {/* бесплатный вход. Лимит настоящий: 5 разборов в неделю — столько
              Сергей реально успевает. Число не завышаем никогда. */}
          <a
            href={TELEGRAM_LINKS.razbor}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('access_razbor')}
            className="mt-8 flex items-start justify-between gap-4 max-w-2xl border rounded-xl p-5 transition-colors group"
            style={{ borderColor: 'hsl(var(--accent) / 0.35)', background: 'hsl(var(--accent) / 0.05)' }}
          >
            <div>
              <div className="text-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'hsl(var(--accent))' }}>
                Вердикт · бесплатно
              </div>
              <div className="mt-2 text-foreground font-medium">Не готовы решать — пришлите одну свою сделку</div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ту, где вы всё сделали правильно и всё равно получили убыток. Нужен скрин с компьютера,
                где виден вход и стоп, и пара фраз, почему вы вошли. В течение 48 часов отвечу лично
                голосовым: прошла бы эта сделка допуск или нет и на чём именно она сломалась. Случай
                требует объяснений — запишу видеоразбор.
              </p>
              <p className="mt-2 text-sm text-foreground/80">
                Скажу и то, какой уровень вам нужен. И скажу, если не нужен никакой.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Разбираю валютные пары, золото и металлы, нефть, биткоин и эфир. Другую крипту не смотрю.
                Скрины с телефона и сделки без описания не разбираю. Беру 5 разборов в неделю.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(var(--accent))' }} />
          </a>

          <div className="mt-12 md:mt-16">
            <WhereYouAreNow showPrices={true} />
          </div>

          <div className="mt-10 md:mt-14">
            <ProofStrip />
          </div>

          <div className="mt-12 md:mt-16">
            <FiveStagesSection showPrices={true} asSection={false} />
          </div>

          <div className="mt-12 md:mt-16">
            <PackageCards showPrices={true} ctaHref={TELEGRAM_LINKS.dm} />
          </div>

          {/* вопросы перед оплатой — после цен экосистемы */}
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
              Оставить заявку на обучение
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-sm text-muted-foreground">
              Каждую заявку разбираю лично, поэтому беру не всех ·{' '}
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
