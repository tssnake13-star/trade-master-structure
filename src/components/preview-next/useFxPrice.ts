import { useEffect, useRef, useState } from 'react';

/**
 * useFxPrice — live GBP/JPY for the v3 HUD ticker.
 *
 * Pulls the real current rate from the free, key-less, CORS-enabled
 * open.er-api.com and re-anchors every 60s. Between fetches the value
 * mean-reverts toward the last real rate with small per-second noise, so the
 * tape feels alive without drifting away from the truth. If the network is
 * unavailable it hovers around a plausible base. `dir` is the last tick's
 * direction; `changePct` is the move since the first observed rate.
 */
const BASE = 214.0; // plausible GBP/JPY until the real rate lands

export function useFxPrice() {
  const [price, setPrice] = useState<number>(BASE);
  const [dir, setDir] = useState<1 | -1>(1);
  const anchorRef = useRef<number>(BASE); // last real rate — jitter reverts here
  const openRef = useRef<number>(BASE);   // first real rate — basis for change %
  const haveReal = useRef(false);

  useEffect(() => {
    let alive = true;

    const fetchReal = async () => {
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/GBP', { cache: 'no-store' });
        const j = await r.json();
        const p = typeof j?.rates?.JPY === 'number' ? j.rates.JPY : null;
        if (p && alive) {
          anchorRef.current = p;
          if (!haveReal.current) { haveReal.current = true; openRef.current = p; setPrice(p); }
        }
      } catch {
        /* keep current value */
      }
    };

    fetchReal();
    const poll = setInterval(fetchReal, 60000);
    // per-second "alive" tick: mean-revert toward the real anchor + tiny noise
    const jitter = setInterval(() => {
      setPrice((p) => {
        const next = p + (anchorRef.current - p) * 0.1 + (Math.random() - 0.5) * 0.06;
        setDir(next >= p ? 1 : -1);
        return next;
      });
    }, 1000);

    return () => { alive = false; clearInterval(poll); clearInterval(jitter); };
  }, []);

  const changePct = openRef.current ? ((price - openRef.current) / openRef.current) * 100 : 0;
  return { price, dir, changePct };
}
