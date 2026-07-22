import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * AdmissionCheckSection → блок «Разбор сделок» (личный вердикт).
 * Стоит вторым экраном, сразу под hero: это первое действие, до которого
 * доскролливают все. Одновременно фильтр — чтобы получить вердикт, нужно
 * прислать 3 СВОИ сделки; у «сигнальщика» их нет, отбор идёт сам, без анкет.
 * Лид присылает сделки в бота → Сергей лично записывает видеоразбор.
 * Дубль — только на /access перед ценами (для сомневающихся).
 */

const STEPS = [
  'Присылаете в бот три последние сделки: скрин, где вход, стоп и тейк, и одна фраза, почему вошли.',
  'Я лично прогоняю каждую через свою систему допуска.',
  'Вы получаете видео на 5–7 минут: где система сказала бы «да», где «нет», и почему.',
];

export default function AdmissionCheckSection() {
  return (
    <section id="verdict" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>Разбор сделок</span>
          <h2 className="text-foreground">
            Три ваши последние сделки покажут, <em>почему счёт не растёт</em>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground" style={{ maxWidth: '56ch' }}>
            Личный видеоразбор от практикующего трейдера. Бесплатно. Без обязательств.
          </p>
        </div>

        {/* механика тремя шагами */}
        <div className="mt-8 md:mt-10 grid md:grid-cols-3 gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="border border-border rounded-xl bg-card p-5">
              <div className="font-['Martian_Mono'] text-[11px] tracking-[0.2em]" style={{ color: 'hsl(var(--accent))' }}>
                0{i + 1}
              </div>
              <p className="mt-3 text-sm md:text-base text-foreground leading-relaxed">{s}</p>
            </div>
          ))}
        </div>

        {/* честное ограничение — усиливает ценность и мягкую срочность */}
        <p className="mt-6 text-sm text-muted-foreground" style={{ maxWidth: '56ch' }}>
          Каждый разбор записываю сам, поэтому беру несколько человек в неделю.
        </p>

        <div className="mt-7">
          <a
            href={TELEGRAM_LINKS.razbor}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm md:text-base font-medium group"
          >
            Получить вердикт по моим сделкам
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
