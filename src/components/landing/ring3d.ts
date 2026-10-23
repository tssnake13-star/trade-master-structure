/**
 * Кольцо последнего экрана объёмным предметом (проба 3D по адресу с ?3d, 23.10.2026). Сергей: «Я же сказал
 * тебе, что я хочу 3D-сайт… 3D-модели». Те же 7 делений и тот же отсчёт, что в FinalRing, только настоящей
 * формой: прозрачная трубка-обод, внутри 7 светящихся дуг, вокруг свечение и искры в объёме. Кольцо наклонено
 * и поворачивается за мышью и прокруткой: ближний край больше дальнего, искры уходят вглубь.
 *
 * Чистый WebGL без библиотек, как пар первого экрана (heroDepth.ts). Свет складывается (ONE, ONE), а в альфу
 * пишется яркость: на чёрной странице это и есть свечение поверх фона.
 */

const SEG = (Math.PI * 2) / 7;
const GAP = 0.09;

const VS_TUBE = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec3 aArc; // x — угол по кольцу от верха по часовой, y — доля длины дуги, z — номер дуги
uniform mat4 uMV;
uniform mat4 uP;
uniform vec2 uShift;
uniform float uSeg[7];
varying vec3 vN;
varying vec3 vV;
varying vec2 vArc;
varying float vB;
void main() {
  vec4 v = uMV * vec4(aPos, 1.0);
  vN = mat3(uMV) * aNrm;
  vV = -v.xyz;
  vArc = aArc.xy;
  float b = 0.0;
  for (int k = 0; k < 7; k++) { if (float(k) == aArc.z) b = uSeg[k]; }
  vB = b;
  vec4 p = uP * v;
  p.xy += uShift * p.w;
  gl_Position = p;
}`;

// сердцевина и два слоя свечения вокруг неё: яркость падает к краю трубки, как у неона
const FS_LIGHT = `
precision highp float;
uniform float uDraw;
uniform float uKind;
varying vec3 vN;
varying vec3 vV;
varying vec2 vArc;
varying float vB;
void main() {
  float f = abs(dot(normalize(vN), normalize(vV)));
  float front = smoothstep(uDraw + 0.02, uDraw - 0.16, vArc.x);
  float caps = smoothstep(0.0, 0.035, vArc.y) * smoothstep(1.0, 0.965, vArc.y);
  vec3 warm = vec3(1.0, 0.6, 0.22);
  vec3 hot = vec3(1.0, 0.93, 0.78);
  vec3 c;
  if (uKind < 0.5) {
    c = mix(warm, hot, pow(f, 1.4) * clamp(vB, 0.0, 1.0)) * (0.2 + 1.05 * vB);
  } else if (uKind < 1.5) {
    c = warm * pow(f, 1.8) * (0.05 + 0.6 * vB);
  } else {
    c = warm * pow(f, 3.0) * (0.015 + 0.24 * vB);
  }
  c *= front * caps;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}`;

// обод из прозрачного материала: по краям трубки блик, сверху отражение светлого потолка, у горящей дуги теплеет
const FS_GLASS = `
precision highp float;
uniform float uDraw;
varying vec3 vN;
varying vec3 vV;
varying vec2 vArc;
varying float vB;
void main() {
  vec3 n = normalize(vN);
  float f = abs(dot(n, normalize(vV)));
  float rim = pow(1.0 - f, 3.0);
  float top = smoothstep(0.25, 0.95, n.y);
  float front = smoothstep(uDraw + 0.02, uDraw - 0.16, vArc.x);
  float b = clamp(vB, 0.0, 1.0);
  vec3 c = mix(vec3(0.78, 0.82, 0.9), vec3(1.0, 0.72, 0.36), b);
  float a = (0.025 + 0.4 * rim + 0.1 * top) * (0.55 + 0.45 * b) * front;
  gl_FragColor = vec4(c * a, a);
}`;

const VS_SPARK = `
attribute vec4 aS; // угол, радиус, глубина, фаза
uniform mat4 uMV;
uniform mat4 uP;
uniform vec2 uShift;
uniform float uTime;
uniform float uPx;
uniform float uGlow;
varying float vA;
void main() {
  float dir = fract(aS.w * 3.0) > 0.5 ? 1.0 : -1.0;
  float th = aS.x + uTime * (0.02 + 0.035 * fract(aS.w * 7.0)) * dir;
  float rise = mod(uTime * 0.045 + aS.w * 3.0, 0.9) - 0.45;
  vec3 p = vec3(sin(th) * aS.y, cos(th) * aS.y + rise, aS.z);
  vec4 v = uMV * vec4(p, 1.0);
  vec4 q = uP * v;
  q.xy += uShift * q.w;
  gl_Position = q;
  float tw = 0.3 + 0.7 * abs(sin(uTime * 0.8 + aS.w * 6.2832));
  vA = tw * (1.0 - smoothstep(0.3, 0.45, abs(rise))) * uGlow;
  gl_PointSize = (0.012 + 0.02 * fract(aS.w * 13.0)) * uPx / -v.z;
}`;

const FS_SPARK = `
precision highp float;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, r);
  vec3 c = vec3(1.0, 0.86, 0.62) * a * a * vA;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}`;

// тёплое марево на стене за кольцом: квадрат всегда лицом к зрителю
const VS_HAZE = `
attribute vec2 aQ;
uniform mat4 uMV;
uniform mat4 uP;
uniform vec2 uShift;
varying vec2 vQ;
void main() {
  vec4 v = uMV * vec4(0.0, 0.0, 0.0, 1.0) + vec4(aQ * 1.9, -0.6, 0.0);
  vec4 q = uP * v;
  q.xy += uShift * q.w;
  gl_Position = q;
  vQ = aQ;
}`;

const FS_HAZE = `
precision highp float;
uniform float uHaze;
varying vec2 vQ;
void main() {
  float r = length(vQ);
  float ring = exp(-pow((r - 0.53) / 0.17, 2.0));
  float a = (0.05 + 0.11 * ring) * smoothstep(1.0, 0.72, r) * uHaze;
  vec3 c = vec3(0.95, 0.66, 0.29) * a;
  gl_FragColor = vec4(c, a);
}`;

export type Ring3DFrame = {
  /** яркость 7 дуг: около 0,2 — тусклая, 1 — горит, больше 1 — вспышка */
  seg: number[];
  /** какая часть круга прорисована при появлении, 0…1 */
  drawn: number;
  /** общее свечение: марево и искры */
  glow: number;
  /** наклон кольца, радианы: x — верх к зрителю, y — поворот вбок */
  tiltX: number;
  tiltY: number;
  /** секунды для искр */
  time: number;
};

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function program(gl: WebGLRenderingContext, vs: string, fs: string) {
  const v = shader(gl, gl.VERTEX_SHADER, vs);
  const f = shader(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/** трубка вдоль дуг кольца радиуса 1: позиция, нормаль, (угол, доля дуги, номер дуги) */
function tube(r: number, arcs: Array<[number, number]>, perArc: number, around: number, wholeRing: boolean) {
  const data: number[] = [];
  const idx: number[] = [];
  arcs.forEach(([a0, a1], ai) => {
    const base = data.length / 9;
    for (let i = 0; i <= perArc; i++) {
      const t = i / perArc;
      const th = a0 + (a1 - a0) * t;
      const ux = Math.sin(th), uy = Math.cos(th);
      const seg = wholeRing ? Math.min(6, Math.floor(th / SEG)) : ai;
      for (let j = 0; j <= around; j++) {
        const ph = (j / around) * Math.PI * 2;
        const nx = Math.cos(ph) * ux, ny = Math.cos(ph) * uy, nz = Math.sin(ph);
        data.push(ux + r * nx, uy + r * ny, r * nz, nx, ny, nz, th, t, seg);
      }
    }
    for (let i = 0; i < perArc; i++) {
      for (let j = 0; j < around; j++) {
        const a = base + i * (around + 1) + j, b = a + around + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  });
  return { data: new Float32Array(data), idx: new Uint16Array(idx) };
}

// матрицы 4×4 по столбцам
type M4 = Float32Array;
const mul = (a: M4, b: M4) => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
};
const rotX = (a: number) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
const rotY = (a: number) => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
const moveZ = (z: number) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);
const persp = (fovy: number, aspect: number, n: number, f: number) => {
  const t = 1 / Math.tan(fovy / 2);
  return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]);
};

const FOV = 0.7;

export function createRing3D(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  const pTube = program(gl, VS_TUBE, FS_LIGHT);
  const pGlass = program(gl, VS_TUBE, FS_GLASS);
  const pSpark = program(gl, VS_SPARK, FS_SPARK);
  const pHaze = program(gl, VS_HAZE, FS_HAZE);
  if (!pTube || !pGlass || !pSpark || !pHaze) return null;

  const arcs: Array<[number, number]> = Array.from({ length: 7 }, (_, i) => [i * SEG + GAP / 2, (i + 1) * SEG - GAP / 2]);
  const mesh = (m: { data: Float32Array; idx: Uint16Array }) => {
    const buf = gl.createBuffer();
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, m.data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
    return { buf, ib, count: m.idx.length };
  };
  // толщины в долях радиуса кольца: сердцевина ~3,6 px при радиусе 330 px, как линия плоского кольца
  const core = mesh(tube(0.0055, arcs, 44, 10, false));
  const haloNear = mesh(tube(0.036, arcs, 44, 14, false));
  const haloFar = mesh(tube(0.095, arcs, 44, 14, false));
  const glass = mesh(tube(0.017, [[0, Math.PI * 2]], 210, 16, true));

  // искры в объёме вокруг кольца
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sparks = new Float32Array(Array.from({ length: 70 }, () => [rnd() * Math.PI * 2, 0.72 + rnd() * 0.8, (rnd() - 0.5) * 0.9, rnd()]).flat());
  const sparkBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sparks, gl.STATIC_DRAW);
  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const loc = (p: WebGLProgram) => ({
    pos: gl.getAttribLocation(p, 'aPos'), nrm: gl.getAttribLocation(p, 'aNrm'), arc: gl.getAttribLocation(p, 'aArc'),
    s: gl.getAttribLocation(p, 'aS'), q: gl.getAttribLocation(p, 'aQ'),
    mv: gl.getUniformLocation(p, 'uMV'), pr: gl.getUniformLocation(p, 'uP'), shift: gl.getUniformLocation(p, 'uShift'),
    seg: gl.getUniformLocation(p, 'uSeg'), draw: gl.getUniformLocation(p, 'uDraw'), kind: gl.getUniformLocation(p, 'uKind'),
    time: gl.getUniformLocation(p, 'uTime'), px: gl.getUniformLocation(p, 'uPx'), glow: gl.getUniformLocation(p, 'uGlow'),
    haze: gl.getUniformLocation(p, 'uHaze'),
  });
  const L = { tube: loc(pTube), glass: loc(pGlass), spark: loc(pSpark), haze: loc(pHaze) };

  let proj = persp(FOV, 1, 0.1, 50);
  let dist = 5;
  let shift = [0, 0];
  let pxScale = 1000;

  const bindTube = (l: ReturnType<typeof loc>, m: { buf: WebGLBuffer | null; ib: WebGLBuffer | null }) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
    gl.enableVertexAttribArray(l.pos);
    gl.vertexAttribPointer(l.pos, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(l.nrm);
    gl.vertexAttribPointer(l.nrm, 3, gl.FLOAT, false, 36, 12);
    gl.enableVertexAttribArray(l.arc);
    gl.vertexAttribPointer(l.arc, 3, gl.FLOAT, false, 36, 24);
  };
  const common = (l: ReturnType<typeof loc>, mv: M4) => {
    gl.uniformMatrix4fv(l.mv, false, mv);
    gl.uniformMatrix4fv(l.pr, false, proj);
    gl.uniform2f(l.shift, shift[0], shift[1]);
  };
  const off = () => {
    for (let i = 0; i < 4; i++) gl.disableVertexAttribArray(i);
  };

  return {
    /** размеры холста в css-пикселях, плотность, центр кольца в холсте и его радиус в css-пикселях */
    resize(W: number, H: number, dpr: number, cx: number, cy: number, R: number) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      proj = persp(FOV, W / H, 0.1, 50);
      const focal = H / 2 / Math.tan(FOV / 2);
      dist = focal / R;
      shift = [(cx / W) * 2 - 1, 1 - (cy / H) * 2];
      pxScale = focal * dpr;
    },
    draw(f: Ring3DFrame) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      const mv = mul(moveZ(-dist), mul(rotY(f.tiltY), rotX(f.tiltX)));
      const drawn = f.drawn >= 1 ? 10 : f.drawn * Math.PI * 2;
      const segs = new Float32Array(f.seg);

      // марево на стене
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pHaze);
      common(L.haze, mv);
      gl.uniform1f(L.haze.haze, f.glow);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(L.haze.q);
      gl.vertexAttribPointer(L.haze.q, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      off();

      // обод: обычное наложение с альфой
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(pGlass);
      common(L.glass, mv);
      gl.uniform1fv(L.glass.seg, segs);
      gl.uniform1f(L.glass.draw, drawn);
      bindTube(L.glass, glass);
      gl.drawElements(gl.TRIANGLES, glass.count, gl.UNSIGNED_SHORT, 0);
      off();

      // свет: дальнее свечение, ближнее, сердцевина — всё складывается
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pTube);
      common(L.tube, mv);
      gl.uniform1fv(L.tube.seg, segs);
      gl.uniform1f(L.tube.draw, drawn);
      ([[haloFar, 2], [haloNear, 1], [core, 0]] as const).forEach(([m, kind]) => {
        gl.uniform1f(L.tube.kind, kind);
        bindTube(L.tube, m);
        gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
      });
      off();

      // искры
      gl.useProgram(pSpark);
      common(L.spark, mv);
      gl.uniform1f(L.spark.time, f.time);
      gl.uniform1f(L.spark.px, pxScale);
      gl.uniform1f(L.spark.glow, f.glow * Math.min(1, f.drawn * 1.2));
      gl.bindBuffer(gl.ARRAY_BUFFER, sparkBuf);
      gl.enableVertexAttribArray(L.spark.s);
      gl.vertexAttribPointer(L.spark.s, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, sparks.length / 4);
      off();
    },
  };
}
