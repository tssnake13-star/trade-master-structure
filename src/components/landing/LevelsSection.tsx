import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const levels = [
  { tag: 'Level 1', name: 'Trade System', desc: 'Алгоритм принятия решений, мышление трейдера, фундамент системы.', featured: false },
  { tag: 'Level 2 · популярный', name: 'Trade OS', desc: 'Торговая система в полном объёме, сценарии рынка, дисциплинарная группа.', featured: true },
  { tag: 'Level 3', name: 'Trade OS Plus', desc: 'Полный доступ ко всей теоретической базе и инструментам системы.', featured: false },
];

const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">11 · Уровни</span>
          <h2 className="text-foreground">
            Три уровня <em>глубины</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            От алгоритма принятия решений — до полного доступа к системе и инструментам. Стоимость — индивидуально, после короткой фильтрации.
          </p>
        </div>

        <div className="mt-8 md:mt-10 grid md:grid-cols-3 gap-3">
          {levels.map((l) => (
            <div
              key={l.name}
              className="rounded-xl bg-card p-6"
              style={{ border: l.featured ? '1px solid hsl(var(--accent) / 0.4)' : '1px solid hsl(var(--border))' }}
            >
              <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--accent))' }}>{l.tag}</div>
              <div className="font-['Bricolage_Grotesque'] text-2xl mt-2 text-foreground">{l.name}</div>
              <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">{l.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-card p-5" style={{ border: '1px solid hsl(var(--border))' }}>
          <div className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--cool))' }}>Подписка на экосистему · только выпускникам</div>
          <p className="mt-2 text-sm md:text-base text-muted-foreground">
            Echo-Gate (сигнальный бот), HunterBot (автоисполнение и сопровождение), Risk Sentinel (защита капитала). Форматы аренды и бессрочно — обсуждаются индивидуально.
          </p>
        </div>

        <div className="mt-8">
          <a
            href={TELEGRAM_LINKS.bot}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary group text-center"
          >
            Узнать стоимость и условия
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default LevelsSection;
