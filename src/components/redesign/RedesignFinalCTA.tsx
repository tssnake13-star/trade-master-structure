import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * Final CTA — editorial. Single column, large Fraunces statement,
 * mono pill button, meta-strip footer with sequence indicator.
 */
const RedesignFinalCTA = () => {
  return (
    <section id="cta" className="reveal py-24 md:py-36 border-y border-[hsl(var(--rule-soft))] bg-[hsl(var(--card)/0.4)]">
      <div className="container-landing">
        <div className="max-w-3xl mx-auto text-center">
          <div className="kicker justify-center mb-8">
            <span className="num">015</span>
            <span className="dot">·</span>
            <span>ADMISSION · ДОПУСК</span>
          </div>

          <h2 className="font-['Fraunces'] text-4xl md:text-6xl lg:text-7xl text-foreground leading-[1.02] tracking-tight mb-10">
            Заберите <em className="italic text-[hsl(var(--warm))] font-light">систему</em><br />
            допуска
          </h2>

          <div className="space-y-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-12">
            <p>Короткая фильтрация. PDF с разбором логики решения.</p>
            <p className="text-foreground font-medium">Это не обучение.</p>
            <p>Это точка, где становится понятно, почему вы теряете.</p>
          </div>

          <a
            href={TELEGRAM_LINKS.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-foreground text-background rounded-full font-mono text-xs uppercase tracking-[0.18em] hover:bg-[hsl(var(--warm))] transition-colors duration-300"
          >
            Получить допуск
            <span aria-hidden>→</span>
          </a>

          <div className="mt-14 pt-6 border-t border-[hsl(var(--rule-soft))] flex items-center justify-between text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground">
            <span>SEQ · 015 / 016</span>
            <span>EST · 2 МИН</span>
            <span>FMT · TG · BOT</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RedesignFinalCTA;