import { ArrowRight, MessageCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import heroAuthor from '@/assets/hero-author.jpg';

const principles = [
  'Контекст рынка',
  'Сценарий',
  'Подтверждение',
  'Зона входа',
  'Жёсткий риск-менеджмент',
];

const HeroSection = () => {
  return (
    <section className="min-h-[100svh] lg:min-h-screen flex items-center pt-16 md:pt-20 pb-8 md:pb-16 lg:pb-24">
      <div className="container-landing">
        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 max-w-2xl order-2 lg:order-1">
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-foreground fade-in-up">
              Трейдинг — это не поиск входов. Это система принятия решений.
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-foreground/90 leading-snug fade-in-up fade-in-up-delay-1">
              Большинство трейдеров теряют деньги не из-за плохих входов. Они теряют деньги потому, что принимают решения хаотично. В TRADELIKETYO вы не учитесь искать сделки. Вы учитесь разрешать или запрещать их системой.
            </p>

            {/* Principles list */}
            <ul className="mt-6 md:mt-8 space-y-2 fade-in-up fade-in-up-delay-1">
              {principles.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-sm md:text-base text-muted-foreground">
                  <span className="text-mono text-xs text-foreground/40">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm md:text-base text-muted-foreground/70 fade-in-up fade-in-up-delay-1">
              Каждая сделка проходит через алгоритм. Минимум сделок. Максимум качества.
            </p>
            
            {/* CTA */}
            <div className="mt-8 md:mt-10 flex flex-col gap-3 fade-in-up fade-in-up-delay-2">
              <a
                href={TELEGRAM_LINKS.bot}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary group text-base md:text-lg"
              >
                Получить алгоритм
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              
              <a
                href={TELEGRAM_LINKS.dm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm text-muted-foreground font-medium rounded-lg border border-border/50 hover:text-foreground hover:border-border transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                Написать Сергею
              </a>
            </div>
          </div>
          
          {/* Author Photo */}
          <div className="flex-shrink-0 fade-in-up fade-in-up-delay-1 order-1 lg:order-2">
            <div className="relative w-48 h-56 md:w-72 md:h-[24rem] lg:w-[28rem] lg:h-[36rem] xl:w-[32rem] xl:h-[44rem] rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={heroAuthor}
                alt="Сергей — автор системы TRADELIKETYO"
                className="w-full h-full object-cover object-top brightness-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-background/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
