import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';

/**
 * AdmissionCheckSection → блок «Разбор сделок» (личный вердикт).
 * Стоит вторым экраном, сразу под hero: это первое действие, до которого
 * доскролливают все. Одновременно фильтр — чтобы получить вердикт, нужно
 * прислать СВОЮ сделку; у «сигнальщика» её нет, отбор идёт сам, без анкет.
 * Лид присылает сделку в бота → Сергей лично записывает видеоразбор.
 * Одна сделка, а не три: так же просит бот и страница цен, и порог входа ниже.
 * Тейк не упоминаем: у убыточной сделки его не бывает, а просим именно её.
 * Дубль — только на /access перед ценами (для сомневающихся).
 */

const STEPS = [
  'Присылаете в бот одну свою сделку: ту, где всё сделали правильно, а убыток всё равно случился. Скрин со входом и стопом и одна фраза, почему вошли.',
  'Я лично прогоняю её через свою систему допуска.',
  'Вы получаете видео на 5–7 минут: сказала бы система «да» или «нет» и на чём сломалось решение.',
];

export default function AdmissionCheckSection() {
  return (
    <section id="verdict" className="section-animate py-12 md:py-20 bg-card/50 border-y border-border">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label" style={{ color: 'hsl(var(--accent))' }}>Разбор сделок</span>
          <h2 className="text-foreground">
            Одна ваша сделка покажет, <em>почему счёт не растёт</em>
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
            onClick={() => trackClick('verdict_razbor')}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm md:text-base font-medium group"
          >
            Получить вердикт по моей сделке
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
