import { ArrowRight, Check } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const points = [
  'Один торговый алгоритм вместо хаоса и "чутья"',
  'Фильтрация сделок, а не погоня за входами',
  'Чёткие правила действий до, во время и после сделки',
  'Контроль риска как часть системы, а не реакция на убыток',
];

const UniquenessSection = () => {
  return (
    <section className="py-16 md:py-24 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          {/* Main heading */}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-foreground">
            Я не продаю знания. Я встраиваю операционную систему мышления трейдера.
          </h2>
          
          {/* Subheading */}
          <p className="mt-5 md:mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Вы перестаёте угадывать рынок и собирать стратегии.
          </p>
          <p className="mt-2 text-base md:text-lg text-muted-foreground leading-relaxed">
            Вы начинаете принимать решения по одному протоколу, который работает на дистанции, а не от сделки к сделке.
          </p>
          
          {/* Points list */}
          <ul className="mt-8 md:mt-10 space-y-4">
            {points.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-foreground/70 mt-0.5 flex-shrink-0" />
                <span className="text-foreground text-base md:text-lg">{point}</span>
              </li>
            ))}
          </ul>
          
          {/* Comparison question */}
          <div className="mt-10 md:mt-12">
            <h3 className="text-lg md:text-xl font-medium text-foreground">
              Чем это отличается от других школ и экспертов по трейдингу?
            </h3>
            <div className="mt-4 space-y-2">
              <p className="text-muted-foreground text-base">
                Большинство учат стратегиям и входам.
              </p>
              <p className="text-muted-foreground text-base">
                Я выстраиваю систему принятия решений, которая работает до входа, а не после убытка.
              </p>
              <p className="text-foreground text-base font-medium">
                Вы не ищете сделки — вы понимаете, когда не входить.
              </p>
            </div>
          </div>
          
          {/* CTA buttons - vertical on mobile */}
          <div className="mt-10 flex flex-col gap-3">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              Проверить свою ошибку во входе
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-xs text-muted-foreground">
              Бесплатный разбор логики Ваших входов в Telegram-боте
            </p>
            
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground text-sm font-medium rounded-lg border border-border hover:bg-accent hover:border-muted-foreground/30 transition-all duration-200"
            >
              Разобрать мою ситуацию лично
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UniquenessSection;
