const PAIRS = [
  'DXY',
  'EUR / USD', 'GBP / USD', 'AUD / USD', 'NZD / USD', 'USD / JPY', 'USD / CAD', 'USD / CHF',
  'EUR / JPY', 'GBP / JPY', 'CAD / JPY', 'AUD / JPY', 'NZD / JPY',
  'GBP / AUD', 'EUR / AUD',
  'GBP / NZD', 'EUR / NZD',
  'EUR / GBP', 'EUR / CHF', 'GBP / CHF', 'CAD / CHF', 'EUR / CAD', 'GBP / CAD', 'NZD / CAD', 'AUD / NZD',
  'XAU / USD', 'XAG / USD',
  'BRENT',
  'BTC / USD', 'ETH / USD',
];

const TickerRow = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
  <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
    {PAIRS.map((pair, i) => (
      // между парами просто воздух: точка-разделитель снята с обликом (23.10.2026), пару отмечает свой кружок
      <div key={`${pair}-${i}`} className="flex items-center mr-12">
        <span
          className="inline-block rounded-full"
          style={{
            width: 5,
            height: 5,
            background: 'hsl(var(--muted-foreground))',
            opacity: 0.5,
            marginRight: 10,
          }}
        />
        <span
          className="text-mono"
          style={{
            fontSize: 12.5,
            letterSpacing: '0.04em',
            color: 'hsl(var(--muted-foreground))',
            opacity: 0.6,
          }}
        >
          {pair}
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