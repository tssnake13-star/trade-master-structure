import { TELEGRAM_LINKS } from '@/lib/constants';
import StatsCounter from './StatsCounter';
import Words from '@/components/fx/Words';

const AuthorSection = () => {
  return (
    <section id="author" className="section-animate py-12 md:py-20">
      <div className="container-landing">
        <div className="max-w-4xl">
          {/* 11.10.2026: «которой учу» уводило в обучение; весь сайт говорит «попробуйте систему» */}
          <h2 className="text-foreground mb-8">
            <Words>15 лет в рынке. <em>Торгую по той же системе,</em> <span className="mute">которую даю вам попробовать.</span></Words>
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            <div className="flex-shrink-0">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-xl overflow-hidden bg-secondary">
                <img 
                  alt="Сергей Тё" 
                  className="w-full h-full object-cover" 
                  src="/author-sergey-te.jpg"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-1">
                Сергей Тё
              </h3>
              
              <p className="text-sm text-muted-foreground mb-5">
                Архитектор торговых систем.
              </p>
              
              <div className="space-y-4 mb-6">
                <p className="text-base md:text-lg text-foreground font-medium leading-relaxed">
                  Мои лучшие сделки — те, которые я <span style={{ color: 'hsl(var(--foreground))' }}>не совершил</span>
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Поэтому я не учу угадывать входы
                </p>
                <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                  Я выстраиваю систему<br />
                  которая принимает решение
                </p>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Где вы перестаёте действовать на ощущениях
                </p>
              </div>

              {/* «14 лет в рынке» отсюда убрано 11.10.2026: оно стоит в заголовке и в цифрах ниже */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                {['Практикующий трейдер', 'Не сигнальщик, не инфобизнесмен'].map((s) => (
                  <span key={s} className="font-ui text-[12.5px] tracking-[0.01em]" style={{ color: 'hsl(var(--foreground))' }}>{s}</span>
                ))}
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Торгует свинг по той же системе, что работает в терминале ECHO-GATE INSIDE: разбор рынка
                на выходных, в будни короткая проверка.
              </p>

            </div>
          </div>

          {/* 11.10.2026: полоса цифр перенесена сюда из-под первого экрана */}
          <StatsCounter embedded />
        </div>
      </div>
    </section>
  );
};

export default AuthorSection;
