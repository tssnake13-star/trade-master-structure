import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import Magnetic from '@/components/Magnetic';
import { KineticHeadline } from './primitives';

/**
 * FinalCTANext — closing call with a soft aurora wash and magnetic CTA.
 */
export default function FinalCTANext() {
  return (
    <section id="cta" className="relative overflow-hidden" style={{ zIndex: 2 }}>
      <div className="pn-aurora" aria-hidden style={{ inset: 'auto -10% -40% -10%', height: '100%' }}>
        <div className="pn-aurora__blob pn-aurora__blob--warm" style={{ left: '30%', top: 'auto', bottom: '-20%' }} />
        <div className="pn-aurora__blob pn-aurora__blob--cool" style={{ right: '20%' }} />
      </div>
      <div className="container-landing relative text-center" style={{ zIndex: 2 }}>
        <div className="section-label mb-6 pn-rise is-in" style={{ justifyContent: 'center' }}>
          Допуск, не сигнал
        </div>
        <KineticHeadline
          as="h2"
          className="text-foreground mx-auto"
          style={{ maxWidth: '18ch' }}
          lines={[['Готовы торговать ', { text: 'по системе', gold: true }, '?']]}
        />
        <p
          className="lede mx-auto mt-6 pn-rise is-in"
          style={{ ['--i' as string]: 2, textAlign: 'center' }}
        >
          Получите систему допуска и начните принимать решения, которые можно повторить.
        </p>
        <div className="mt-10 flex justify-center pn-rise is-in" style={{ ['--i' as string]: 3 }}>
          <Magnetic>
            <a
              href={TELEGRAM_LINKS.bot}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group text-base md:text-lg"
              style={{ animation: 'ctaGlow 4s ease-in-out infinite' }}
            >
              Получить систему допуска
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
