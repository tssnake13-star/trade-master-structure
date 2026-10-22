/**
 * «Живые» мониторы сцены первого экрана: свечи идут в реальном времени, цена ходит
 * в накоплении, выходит из него, терминал отмечает зону и уровень и присылает карточку
 * «допуск» или «отказ». 22.10.2026, Сергей: «один раз появилась, и всё… эффекта вау нету…
 * добавить цикличность, чтобы постоянно что-то происходило».
 *
 * ⚠️ Только свечи, уровни и зоны накопления — индикаторов нет (Сергей 21.10.2026).
 * ⚠️ Карточки — иллюстрация того, как работает терминал: без цен, тейков и процентов.
 *
 * Экраны на картинке стоят в перспективе, поэтому график строится в единичном квадрате
 * и каждая точка переводится на экран гомографией (квадрат → четырёхугольник экрана).
 */

type Pt = [number, number];
type Candle = { o: number; h: number; l: number; c: number; id: number };
type Zone = { from: number; to: number; top: number; bottom: number; born: number; ok: boolean; level: number };
export type LiveEvent = { ok: boolean; dir: 1 | -1 };

const UP = '#dea85c';
const DOWN = '#6c7078';

function homography(q: [Pt, Pt, Pt, Pt]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u: number, v: number): Pt => {
    const w = g * u + h * v + 1;
    return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
  };
}

const f1 = (n: number) => n.toFixed(1);
const ns = 'http://www.w3.org/2000/svg';

export class LiveScreen {
  private map: (u: number, v: number) => Pt;
  private candles: Candle[] = [];
  private zones: Zone[] = [];
  private nextId = 0;
  private mode: 'range' | 'trend' = 'range';
  private left = 9;
  private dir: 1 | -1 = 1;
  private center = 0;
  private rangeFrom = 0;
  private fakeOut = 0;
  private live: { start: number; target: number; seed: number } | null = null;
  private lo = 0;
  private hi = 1;
  private els: Record<string, SVGPathElement>;
  private rnd: () => number;

  constructor(
    parent: SVGGElement,
    quad: [Pt, Pt, Pt, Pt],
    private n: number,
    private candleMs: number,
    seed: number,
    private onEvent: (e: LiveEvent) => void,
  ) {
    this.map = homography(quad);
    let s = seed;
    this.rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const pts = quad.map((p) => p.join(',')).join(' ');
    const clipId = `hdclip${Math.round(this.rnd() * 1e9)}`;
    const clip = document.createElementNS(ns, 'clipPath');
    clip.setAttribute('id', clipId);
    const clipPoly = document.createElementNS(ns, 'polygon');
    clipPoly.setAttribute('points', pts);
    clip.appendChild(clipPoly);
    parent.appendChild(clip);
    const base = document.createElementNS(ns, 'polygon');
    base.setAttribute('points', pts);
    base.setAttribute('fill', '#0c0f13');
    parent.appendChild(base);
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('clip-path', `url(#${clipId})`);
    parent.appendChild(g);
    const make = (attrs: Record<string, string>) => {
      const p = document.createElementNS(ns, 'path');
      for (const k in attrs) p.setAttribute(k, attrs[k]);
      g.appendChild(p);
      return p;
    };
    this.els = {
      zone: make({ fill: '#c9933f' }),
      zoneEdge: make({ fill: 'none', stroke: '#c9933f', 'stroke-width': '1' }),
      level: make({ fill: 'none', stroke: '#e8b264', 'stroke-width': '1.6' }),
      wickUp: make({ fill: 'none', stroke: UP, 'stroke-width': '1.1' }),
      wickDown: make({ fill: 'none', stroke: DOWN, 'stroke-width': '1.1' }),
      up: make({ fill: UP }),
      down: make({ fill: DOWN }),
      mark: make({ fill: '#ffd38a' }),
    };
    // история: спуск, накопление, выход — чтобы экран сразу был «рабочим»
    let p = 0;
    this.center = p;
    for (let i = 0; i < n; i++) p = this.push(p, true);
    // экран открывается на конце накопления: первая карточка появляется через пару секунд
    this.mode = 'range';
    this.center = p;
    this.rangeFrom = this.nextId - 7;
    this.left = 2 + Math.floor(this.rnd() * 4);
  }

  private gauss() {
    return (this.rnd() + this.rnd() + this.rnd() - 1.5) * 1.15;
  }

  /** следующая закрытая свеча; quiet — без событий (история при старте) */
  private nextClose(prev: number): number {
    if (this.mode === 'range') {
      if (this.fakeOut > 0) {
        this.fakeOut--;
        return prev + (this.center - prev) * 0.7 + this.gauss() * 0.3;
      }
      return prev + (this.center - prev) * 0.32 + this.gauss() * 0.9;
    }
    return prev + this.dir * (0.75 + this.rnd() * 0.5) + this.gauss() * 0.55;
  }

  private push(prev: number, quiet = false): number {
    const c = this.nextClose(prev);
    this.addCandle(prev, c);
    this.advanceRegime(c, quiet);
    return c;
  }

  private addCandle(o: number, c: number) {
    const w = 0.25 + this.rnd() * 0.7;
    this.candles.push({ o, c, h: Math.max(o, c) + w * this.rnd(), l: Math.min(o, c) - w * this.rnd(), id: this.nextId++ });
    if (this.candles.length > this.n) this.candles.shift();
  }

  private advanceRegime(c: number, quiet: boolean) {
    if (--this.left > 0) return;
    if (this.mode === 'range') {
      const span = this.candles.filter((k) => k.id >= this.rangeFrom);
      const top = Math.max(...span.map((k) => k.h)), bottom = Math.min(...span.map((k) => k.l));
      // каждый третий выход — ложный: система говорит «отказ», цена возвращается в коридор
      const ok = quiet || this.rnd() > 0.34;
      this.dir = this.rnd() > 0.45 ? 1 : -1;
      if (!quiet) {
        this.zones.push({ from: this.rangeFrom, to: this.nextId, top, bottom, born: performance.now(), ok, level: this.dir > 0 ? top : bottom });
        this.onEvent({ ok, dir: this.dir });
      }
      if (ok) {
        this.mode = 'trend';
        this.left = 4 + Math.floor(this.rnd() * 3);
      } else {
        this.fakeOut = 2;
        this.left = 4 + Math.floor(this.rnd() * 3);
        // ложный выход: одна свеча за край коридора
        const last = this.candles[this.candles.length - 1];
        if (this.dir > 0) last.h = Math.max(last.h, top + 0.9); else last.l = Math.min(last.l, bottom - 0.9);
      }
    } else {
      this.mode = 'range';
      this.center = c;
      this.rangeFrom = this.nextId;
      this.left = 6 + Math.floor(this.rnd() * 4);
    }
  }

  /** поторопить конец накопления: карточки не должны пропадать надолго */
  nudge() {
    if (this.mode === 'range' && this.left > 1 && this.fakeOut === 0) this.left = 1;
  }

  draw(now: number) {
    // живая свеча: цена плавно идёт к закрытию, свеча закрывается, и сразу начинается следующая
    if (!this.live) this.live = { start: now, target: this.nextClose(this.candles[this.candles.length - 1].c), seed: this.rnd() * 10 };
    let t = (now - this.live.start) / this.candleMs;
    if (t >= 1) {
      const closed = this.live.target;
      this.addCandle(this.candles[this.candles.length - 1].c, closed);
      this.advanceRegime(closed, false);
      const start = t > 3 ? now : this.live.start + this.candleMs;
      this.live = { start, target: this.nextClose(closed), seed: this.rnd() * 10 };
      t = (now - start) / this.candleMs;
    }
    t = Math.max(0, Math.min(1, t));
    const prev = this.candles[this.candles.length - 1].c;
    const wob = Math.sin(t * Math.PI) * Math.sin(this.live.seed) * 0.25;
    const cur = prev + (this.live.target - prev) * (t * t * (3 - 2 * t)) + wob;
    // график всё время плавно едет влево: за время одной свечи — ровно на одну ячейку
    const glide = t;
    const view: Candle[] = [...this.candles.slice(1), { o: prev, c: cur, h: Math.max(prev, cur) + 0.15, l: Math.min(prev, cur) - 0.15, id: -1 }];
    let lo = Infinity, hi = -Infinity;
    for (const k of view) { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }
    // шкала цены подстраивается плавно, без прыжков
    this.lo += (lo - this.lo) * 0.03;
    this.hi += (hi - this.hi) * 0.03;
    if (this.hi - this.lo < 4) this.hi = this.lo + 4;

    const U0 = 0.03, U1 = 0.94, V0 = 0.1, V1 = 0.9;
    const slot = (U1 - U0) / view.length;
    const vy = (p: number) => V1 - ((p - this.lo) / (this.hi - this.lo)) * (V1 - V0);
    const P = (u: number, v: number) => { const [x, y] = this.map(u, v); return `${f1(x)} ${f1(y)}`; };
    const quad = (u0: number, v0: number, u1: number, v1: number) => `M${P(u0, v0)}L${P(u1, v0)}L${P(u1, v1)}L${P(u0, v1)}Z`;

    let up = '', down = '', wu = '', wd = '';
    const firstId = this.candles[1]?.id ?? 0;
    view.forEach((k, i) => {
      const uc = U0 + slot * (i + 0.5 - glide), bw = slot * 0.31;
      const top = vy(Math.max(k.o, k.c)), bot = Math.max(vy(Math.min(k.o, k.c)), top + 0.004);
      const body = quad(uc - bw, top, uc + bw, bot);
      const wick = `M${P(uc, vy(k.h))}L${P(uc, vy(k.l))}`;
      if (k.c >= k.o) { up += body; wu += wick; } else { down += body; wd += wick; }
    });

    let zone = '', edge = '', level = '', mark = '';
    let glow = 0;
    this.zones = this.zones.filter((z) => z.to > firstId - 2);
    for (const z of this.zones) {
      const sh = glide;
      const u0 = U0 + slot * Math.max(-1, z.from - firstId - sh), u1 = U0 + slot * (z.to - firstId - sh);
      if (u1 <= U0) continue;
      const r = quad(u0, vy(z.top), u1, vy(z.bottom));
      zone += r; edge += r;
      const age = (now - z.born) / 1000;
      glow = Math.max(glow, Math.sin(Math.min(1, age / 3.2) * Math.PI));
      if (z.ok) {
        // уровень прорисовывается от зоны вправо
        const k = Math.min(1, age / 1.6);
        const reach = k * k * (3 - 2 * k);
        level += `M${P(u1, vy(z.level))}L${P(u1 + (U1 - u1) * reach, vy(z.level))}`;
        if (age < 3.5) {
          const pulse = (0.006 + 0.003 * Math.sin(age * 5)) * Math.sin(Math.min(1, age / 3.5) * Math.PI);
          mark += quad(u1 - pulse, vy(z.level) - pulse * 1.6, u1 + pulse, vy(z.level) + pulse * 1.6);
        }
      }
    }
    const e = this.els;
    e.up.setAttribute('d', up); e.down.setAttribute('d', down);
    e.wickUp.setAttribute('d', wu); e.wickDown.setAttribute('d', wd);
    e.zone.setAttribute('d', zone); e.zoneEdge.setAttribute('d', edge);
    e.level.setAttribute('d', level); e.mark.setAttribute('d', mark);
    e.zone.setAttribute('fill-opacity', (0.1 + 0.28 * glow).toFixed(3));
    e.zoneEdge.setAttribute('stroke-opacity', (0.25 + 0.6 * glow).toFixed(3));
  }
}
