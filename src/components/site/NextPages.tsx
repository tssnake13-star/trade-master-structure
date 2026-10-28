import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Words from '@/components/fx/Words';

/** «Куда дальше» в конце страницы: две другие страницы сайта (28.10.2026). */
export default function NextPages({ items }: { items: { to: string; title: string; text: string }[] }) {
  return (
    <section id="next" className="section-animate py-14 md:py-20">
      <div className="container-landing">
        <h2 className="text-foreground"><Words>Куда дальше</Words></h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="ns-next ns-panel group p-7 md:p-8 flex flex-col">
              <span className="flex items-center gap-3 text-2xl md:text-[28px] font-bold text-foreground" style={{ letterSpacing: '-0.025em' }}>
                {it.title}
                <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--v3-gold)' }} />
              </span>
              <span className="mt-3 text-base leading-relaxed text-muted-foreground">{it.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
