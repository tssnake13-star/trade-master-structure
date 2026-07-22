import { TELEGRAM_LINKS } from '@/lib/constants';
import PackageCards from './PackageCards';

const LevelsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/40 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">13 · Сотрудничество</span>
          <h2 className="text-foreground">
            Выберите <em>формат</em> работы
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '56ch' }}>
            Не курс ради курса, а система, которая остаётся с вами. От алгоритма принятия решений —
            до полной инфраструктуры с автоисполнением и защитой капитала.
          </p>
          <p className="mt-5 text-base md:text-lg text-foreground">
            Обучение: <span style={{ color: 'hsl(var(--accent))', fontWeight: 500 }}>$599+</span>, в зависимости от уровня.
          </p>
        </div>

        <div className="mt-8 md:mt-12">
          {/* prices are hidden on the homepage — shown only on the private /access page */}
          <PackageCards showPrices={false} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Места ограничены · набор закрывается в ближайшее воскресенье ·{' '}
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            задать вопрос Сергею
          </a>
        </p>
      </div>
    </section>
  );
};

export default LevelsSection;
