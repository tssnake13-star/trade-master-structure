const PAIRS = [
  'EUR / USD', 'GBP / JPY', 'XAU / USD', 'USD / CAD',
  'BTC / USDT', 'XAG / USD', 'AUD / USD', 'EUR / JPY',
  'EUR / USD', 'GBP / JPY', 'XAU / USD', 'USD / CAD',
  'BTC / USDT', 'XAG / USD', 'AUD / USD', 'EUR / JPY',
];

const TickerRow = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
  <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
    {PAIRS.map((pair, i) => (
      <div key={`${pair}-${i}`} className="flex items-center">
        <span
          className="inline-block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: 'hsl(var(--accent))',
            opacity: 0.5,
            marginRight: 10,
          }}
        />
        <span
          className="text-mono"
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: 'hsl(var(--muted-foreground))',
            opacity: 0.6,
          }}
        >
          {pair}
        </span>
        <span
          className="text-mono"
          style={{
            fontSize: 12,
            color: 'hsl(var(--muted-foreground))',
            opacity: 0.4,
            margin: '0 28px',
          }}
        >
          ·
        </span>
      </div>
    ))}
  </div>
);

const InstrumentTicker = () => {
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        borderTop: '1px solid hsl(var(--rule))',
        borderBottom: '1px solid hsl(var(--rule))',
        paddingTop: 16,
        paddingBottom: 16,
        background: 'transparent',
      }}
      aria-label="Торгуемые инструменты"
    >
      <div className="ticker-track flex w-max">
        <TickerRow />
        <TickerRow ariaHidden />
      </div>
    </div>
  );
};

export default InstrumentTicker;