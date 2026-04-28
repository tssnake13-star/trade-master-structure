import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const FormatsSection = () => {
  return (
    <section id="formats" className="section-animate py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">12 · Сотрудничество</span>
          <h2 className="text-foreground">
            Как можно <em>работать</em> <span className="mute">вместе</span>
          </h2>

          <div className="mt-6 md:mt-8 space-y-4">
            <p className="text-base md:text-lg text-muted-foreground">
              Есть несколько форматов
            </p>
            <p className="text-base md:text-lg text-muted-foreground">
              От базовой системы<br />
              до глубокой работы с сопровождением
            </p>
            <p className="text-base md:text-lg text-foreground font-medium">
              Но доступ открывается<br />
              только после фильтрации
            </p>
          </div>

          <div className="mt-8">
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-center"
            >
              Пройти фильтрацию
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatsSection;
