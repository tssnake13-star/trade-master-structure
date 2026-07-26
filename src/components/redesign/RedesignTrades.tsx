import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import xagUsdImg from '@/assets/trades/xag-usd-01-06-2026.jpg';
import gbpUsdImg from '@/assets/trades/gbp-usd-10-06-2026.jpg';
import usdCadImg from '@/assets/trades/usd-cad-10-06-2026.jpg';
import usdChfImg from '@/assets/trades/usd-chf-15-06-2026.jpg';
import xauUsdImg from '@/assets/trades/xau-usd-16-06-2026.jpg';
import btcUsdImg from '@/assets/trades/btc-usd-21-06-2026.jpg';

/**
 * RedesignTrades — full-bleed editorial grid of trades.
 * Data is unchanged from TradesSection. We add display-only meta:
 *   tf (timeframe) and direction — derived locally to enrich the overlay
 *   without altering the source description string.
 */

const trades = [
  { instrument: 'XAG/USD', date: '01.06.2026', tf: 'H4', dir: 'SELL' as const, description: 'Оригинал из дневника сделок · WORK-SELL · +20R', image: xagUsdImg },
  { instrument: 'GBP/USD', date: '10.06.2026', tf: 'H4', dir: 'SELL' as const, description: 'Оригинал из дневника сделок · WORK-SELL · +18R', image: gbpUsdImg },
  { instrument: 'USD/CAD', date: '10.06.2026', tf: 'H4', dir: 'BUY' as const, description: 'Оригинал из дневника сделок · WORK-BUY · +24R', image: usdCadImg },
  { instrument: 'USD/CHF', date: '15.06.2026', tf: 'H4', dir: 'BUY' as const, description: 'Оригинал из дневника сделок · WORK-BUY · +20R', image: usdChfImg },
  { instrument: 'XAU/USD', date: '16.06.2026', tf: 'H4', dir: 'SELL' as const, description: 'Оригинал из дневника сделок · WORK-SELL · +16R', image: xauUsdImg },
  { instrument: 'BTC/USD', date: '21.06.2026', tf: 'H4', dir: 'SELL' as const, description: 'Оригинал из дневника сделок · WORK-SELL · +22R', image: btcUsdImg },
];

const monoStyle: React.CSSProperties = {
  fontFamily: "'Martian Mono', ui-monospace, monospace",
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
};

const RedesignTrades = () => {
  const [selected, setSelected] = useState<typeof trades[0] | null>(null);

  return (
    <section id="voices" className="py-24 md:py-32 lg:py-40">
      <div className="container-landing mb-12 md:mb-16">
        <div className="kicker reveal mb-8">
          <span className="num">05</span>
          <span className="dot" />
          <span>FIG_05 · TRADE LOG</span>
        </div>
        <h2 className="reveal max-w-[22ch] mb-6 text-foreground">
          Как выглядит сделка, <em>когда есть</em> система.
        </h2>
        <p className="lede reveal" style={{ transitionDelay: '120ms' }}>
          Ни одна из этих сделок не была обязательной. Все они были разрешены системой.
        </p>
      </div>

      {/* Full-bleed grid, gap 1px on rule-soft */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 reveal"
        style={{ gap: 1, background: 'hsl(var(--rule-soft))' }}
      >
        {trades.map((trade, i) => (
          <button
            key={i}
            onClick={() => setSelected(trade)}
            className="accent-line group relative overflow-hidden text-left"
            style={{
              aspectRatio: '16 / 10',
              background: 'hsl(var(--secondary))',
            }}
          >
            <img
              src={trade.image}
              alt={trade.instrument}
              className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.45] group-hover:brightness-[0.6] transition-[filter] duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/70" />

            {/* Top mono meta */}
            <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
              <span style={{ ...monoStyle, color: 'hsl(var(--foreground) / 0.85)' }}>
                {trade.instrument} <span style={{ opacity: 0.45 }}>·</span> {trade.tf}
              </span>
              <span
                style={{
                  ...monoStyle,
                  color:
                    trade.dir === 'BUY' ? 'hsl(var(--warm))' : 'hsl(var(--cool))',
                }}
              >
                {trade.dir}
              </span>
            </div>

            {/* Bottom row */}
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <span
                style={{ ...monoStyle, color: 'hsl(var(--muted-foreground) / 0.8)' }}
              >
                {trade.date}
              </span>
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontStyle: 'italic',
                  fontSize: 22,
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1,
                }}
              >
                Открыть разбор →
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="container-landing mt-12">
        <p
          className="text-muted-foreground reveal"
          style={{ fontSize: 14, lineHeight: 1.6, maxWidth: '52ch' }}
        >
          Это не поиск идеального входа.<br />
          Это результат дисциплины и работы по алгоритму.
        </p>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 bg-card border-border overflow-hidden">
          <DialogTitle className="sr-only">{selected?.instrument ?? 'Сделка'}</DialogTitle>
          {selected && (
            <div className="relative">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-medium text-foreground">{selected.instrument}</span>
                <span className="text-sm text-muted-foreground">{selected.date}</span>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <img src={selected.image} alt={selected.instrument} className="w-full h-auto" />
              </div>
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selected.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RedesignTrades;