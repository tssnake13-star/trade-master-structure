/**
 * Изогнутый монитор для «Недели по системе» (23.10.2026, Сергей: «Ставь кольцо и монитор, монитор сделай
 * изогнутым»). Настоящая 3D-модель на чистом WebGL, как кольцо (ring3d.ts) и пар первого экрана: экран — дуга
 * цилиндра с картинкой терминала (terminalPaint.ts), тонкая рамка, толщина корпуса, задняя крышка, ножка
 * с основанием, мягкая тень на столе. Свет: ключевой сверху слева и тёплый контровой сзади — как кольцо
 * за мониторами на кадре первого экрана.
 *
 * Единицы модели: длина дуги экрана = 2. Ось цилиндра — вертикаль на z = Rc, края экрана ближе к зрителю.
 */

type Part = { buf: WebGLBuffer | null; idx: WebGLBuffer | null; count: number };

const VS = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec2 aUV;
uniform mat4 uM;
uniform mat4 uVP;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUV;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = mat3(uM) * aNrm;
  vUV = aUV;
  gl_Position = uVP * w;
}`;

// корпус: графит с мягким бликом, контровой тёплый свет по краям
const FS_SOLID = `
precision highp float;
uniform vec3 uColor;
uniform vec3 uEye;
uniform float uSpec;
uniform float uRim;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  vec3 l1 = normalize(vec3(-0.45, 0.65, 0.6));
  vec3 l2 = normalize(vec3(0.35, 0.25, -0.9));
  float d1 = max(dot(n, l1), 0.0);
  float d2 = max(dot(n, l2), 0.0);
  float s1 = pow(max(dot(n, normalize(l1 + v)), 0.0), 40.0) * uSpec;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  // контровой тёплый свет — только на гранях, которые смотрят вбок или назад, не на верх основания
  float side = 1.0 - abs(n.y);
  vec3 c = uColor * (0.28 + 0.8 * d1) + vec3(1.0, 0.62, 0.25) * (0.5 * d2 + 0.3 * rim) * 0.55 * uRim * side + vec3(1.0) * s1 * 0.4;
  gl_FragColor = vec4(c, 1.0);
}`;

// экран: картинка терминала светится сама, сверху стекло — отражение по краям и полоса блика, которая едет при повороте
const FS_SCREEN = `
precision highp float;
uniform sampler2D uTex;
uniform vec3 uEye;
uniform vec3 uBezel;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUV;
void main() {
  vec4 t = texture2D(uTex, vUV);
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  float nv = max(dot(n, v), 0.0);
  vec3 c = t.rgb + uBezel * 0.55 * (1.0 - t.a);
  vec3 r = reflect(-v, n);
  float band = exp(-pow((r.x * 0.9 + r.y * 0.35 - 0.18) / 0.2, 2.0));
  c += vec3(1.0) * (pow(1.0 - nv, 4.0) * 0.22 + band * 0.05);
  gl_FragColor = vec4(c, 1.0);
}`;

// тень на столе и тёплая подсветка за монитором: плоские квадраты с мягким кругом
const FS_SOFT = `
precision highp float;
uniform vec4 uTint;
varying vec2 vUV;
void main() {
  float r = length(vUV * 2.0 - 1.0);
  float a = smoothstep(1.0, 0.0, r);
  a *= a;
  gl_FragColor = vec4(uTint.rgb * a * uTint.a, a * uTint.a);
}`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}
function program(gl: WebGLRenderingContext, fs: string) {
  const v = shader(gl, gl.VERTEX_SHADER, VS);
  const f = shader(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/** собиратель сетки: вершины (позиция, нормаль, uv) и треугольники */
class Builder {
  v: number[] = [];
  i: number[] = [];
  vert(x: number, y: number, z: number, nx: number, ny: number, nz: number, u = 0, w = 0) {
    this.v.push(x, y, z, nx, ny, nz, u, w);
    return this.v.length / 8 - 1;
  }
  tri(a: number, b: number, c: number) { this.i.push(a, b, c); }
  quad(a: number, b: number, c: number, d: number) { this.i.push(a, b, c, a, c, d); }
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
const move = (x: number, y: number, z: number) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
const persp = (fovy: number, aspect: number, n: number, f: number) => {
  const t = 1 / Math.tan(fovy / 2);
  return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]);
};

export type MonitorPose = { rx: number; ry: number; push: number };

/**
 * aspect — ширина экрана к высоте (окно терминала), narrow — портретная раскладка телефона.
 * Возвращает null, если WebGL недоступен: тогда остаётся обычное окно терминала.
 */
export function createCurvedMonitor(canvas: HTMLCanvasElement, aspect: number, narrow: boolean) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  const pSolid = program(gl, FS_SOLID);
  const pScreen = program(gl, FS_SCREEN);
  const pSoft = program(gl, FS_SOFT);
  if (!pSolid || !pScreen || !pSoft) return null;

  // форма: изгиб сильнее у широкого экрана, рамка тонкая («безрамочный»), снизу подбородок чуть толще
  const theta = narrow ? 0.5 : 0.78;
  const Rc = 2 / theta;
  const hh = 1 / aspect;
  const side = 0.016, top = 0.016, chin = 0.03, depth = narrow ? 0.07 : 0.06;
  const ph0 = -theta / 2 - side / Rc, ph1 = theta / 2 + side / Rc;
  const yTop = hh + top, yBot = -hh - chin;
  const standH = narrow ? 0.34 : 0.3;
  const yFloor = yBot - standH;
  const arc = (R: number, ph: number, y: number): [number, number, number] => [R * Math.sin(ph), y, Rc - R * Math.cos(ph)];

  const screenB = new Builder();
  const NU = 64, NV = 2;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU, w = j / NV;
    const ph = (u - 0.5) * theta, y = hh - w * 2 * hh;
    const [x, , z] = arc(Rc - 0.002, ph, y);
    screenB.vert(x, y, z, -Math.sin(ph), 0, Math.cos(ph), u, w);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const a = j * (NU + 1) + i;
    screenB.quad(a, a + 1, a + NU + 2, a + NU + 1);
  }

  // корпус: лицевая рамка, задняя крышка, четыре торца
  const body = new Builder();
  const NB = 64;
  const strip = (R: number, yA: number, yB: number, front: boolean) => {
    const base = body.v.length / 8;
    for (let i = 0; i <= NB; i++) {
      const ph = ph0 + ((ph1 - ph0) * i) / NB;
      const s = front ? 1 : -1;
      const a = arc(R, ph, yA), b = arc(R, ph, yB);
      body.vert(a[0], a[1], a[2], -Math.sin(ph) * s, 0, Math.cos(ph) * s);
      body.vert(b[0], b[1], b[2], -Math.sin(ph) * s, 0, Math.cos(ph) * s);
    }
    for (let i = 0; i < NB; i++) body.quad(base + i * 2, base + i * 2 + 2, base + i * 2 + 3, base + i * 2 + 1);
  };
  strip(Rc, yTop, yBot, true);
  strip(Rc + depth, yTop, yBot, false);
  const cap = (y: number, ny: number) => {
    const base = body.v.length / 8;
    for (let i = 0; i <= NB; i++) {
      const ph = ph0 + ((ph1 - ph0) * i) / NB;
      const a = arc(Rc, ph, y), b = arc(Rc + depth, ph, y);
      body.vert(a[0], a[1], a[2], 0, ny, 0);
      body.vert(b[0], b[1], b[2], 0, ny, 0);
    }
    for (let i = 0; i < NB; i++) body.quad(base + i * 2, base + i * 2 + 2, base + i * 2 + 3, base + i * 2 + 1);
  };
  cap(yTop, 1);
  cap(yBot, -1);
  for (const [ph, sgn] of [[ph0, -1], [ph1, 1]] as const) {
    const nx = Math.cos(ph) * sgn, nz = Math.sin(ph) * sgn;
    const a = arc(Rc, ph, yTop), b = arc(Rc, ph, yBot), c = arc(Rc + depth, ph, yBot), d = arc(Rc + depth, ph, yTop);
    body.quad(body.vert(...a, nx, 0, nz), body.vert(...b, nx, 0, nz), body.vert(...c, nx, 0, nz), body.vert(...d, nx, 0, nz));
  }

  // ножка и основание: металл, за корпусом по центру
  const stand = new Builder();
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const F: Array<[number[], number[][]]> = [
      [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
      [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
      [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]],
      [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
      [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
    ];
    for (const [n, q] of F) stand.quad(...(q.map((p) => stand.vert(p[0], p[1], p[2], n[0], n[1], n[2])) as [number, number, number, number]));
  };
  const zBack = -depth;
  box(-0.075, 0.075, yFloor + 0.02, -hh * 0.2, zBack - 0.07, zBack - 0.02);
  // основание — плоский эллипс со скосом
  const bx = narrow ? 0.42 : 0.36, bz = 0.2, bzc = zBack - 0.02, bh = 0.022;
  const SEGS = 48;
  const ctr = stand.vert(0, yFloor + bh, bzc, 0, 1, 0);
  const ringTop: number[] = [];
  for (let i = 0; i <= SEGS; i++) {
    const a = (i / SEGS) * Math.PI * 2;
    ringTop.push(stand.vert(Math.cos(a) * bx, yFloor + bh, bzc + Math.sin(a) * bz, 0, 1, 0));
  }
  for (let i = 0; i < SEGS; i++) stand.tri(ctr, ringTop[i + 1], ringTop[i]);
  for (let i = 0; i < SEGS; i++) {
    const a0 = (i / SEGS) * Math.PI * 2, a1 = ((i + 1) / SEGS) * Math.PI * 2;
    const n0 = [Math.cos(a0) / bx, 0, Math.sin(a0) / bz], n1 = [Math.cos(a1) / bx, 0, Math.sin(a1) / bz];
    const l0 = Math.hypot(n0[0], n0[2]), l1 = Math.hypot(n1[0], n1[2]);
    stand.quad(
      stand.vert(Math.cos(a0) * bx, yFloor + bh, bzc + Math.sin(a0) * bz, n0[0] / l0, 0, n0[2] / l0),
      stand.vert(Math.cos(a0) * bx, yFloor, bzc + Math.sin(a0) * bz, n0[0] / l0, 0, n0[2] / l0),
      stand.vert(Math.cos(a1) * bx, yFloor, bzc + Math.sin(a1) * bz, n1[0] / l1, 0, n1[2] / l1),
      stand.vert(Math.cos(a1) * bx, yFloor + bh, bzc + Math.sin(a1) * bz, n1[0] / l1, 0, n1[2] / l1),
    );
  }

  // тень на столе и тёплая подсветка позади
  const soft = new Builder();
  soft.quad(soft.vert(-0.75, yFloor - 0.001, bzc - 0.4, 0, 1, 0, 0, 0), soft.vert(0.75, yFloor - 0.001, bzc - 0.4, 0, 1, 0, 1, 0),
    soft.vert(0.75, yFloor - 0.001, bzc + 0.45, 0, 1, 0, 1, 1), soft.vert(-0.75, yFloor - 0.001, bzc + 0.45, 0, 1, 0, 0, 1));
  const gw = 1.55, gh = hh + 0.55;
  soft.quad(soft.vert(-gw, -gh, -0.9, 0, 0, 1, 0, 0), soft.vert(gw, -gh, -0.9, 0, 0, 1, 1, 0),
    soft.vert(gw, gh, -0.9, 0, 0, 1, 1, 1), soft.vert(-gw, gh, -0.9, 0, 0, 1, 0, 1));

  const upload = (b: Builder): Part => {
    const buf = gl.createBuffer();
    const idx = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.v), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(b.i), gl.STATIC_DRAW);
    return { buf, idx, count: b.i.length };
  };
  const P = { screen: upload(screenB), body: upload(body), stand: upload(stand), soft: upload(soft) };

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  let texW = 0, texH = 0;

  const locs = (p: WebGLProgram) => ({
    pos: gl.getAttribLocation(p, 'aPos'), nrm: gl.getAttribLocation(p, 'aNrm'), uv: gl.getAttribLocation(p, 'aUV'),
    m: gl.getUniformLocation(p, 'uM'), vp: gl.getUniformLocation(p, 'uVP'), eye: gl.getUniformLocation(p, 'uEye'),
    color: gl.getUniformLocation(p, 'uColor'), spec: gl.getUniformLocation(p, 'uSpec'), rim: gl.getUniformLocation(p, 'uRim'), tex: gl.getUniformLocation(p, 'uTex'),
    bezel: gl.getUniformLocation(p, 'uBezel'), tint: gl.getUniformLocation(p, 'uTint'),
  });
  const L = { solid: locs(pSolid), screen: locs(pScreen), soft: locs(pSoft) };
  const bind = (l: ReturnType<typeof locs>, part: Part) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, part.buf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, part.idx);
    for (const [a, n, off] of [[l.pos, 3, 0], [l.nrm, 3, 12], [l.uv, 2, 24]] as const) {
      if (a < 0) continue;
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, n, gl.FLOAT, false, 32, off);
    }
  };
  const unbind = () => { for (let i = 0; i < 4; i++) gl.disableVertexAttribArray(i); };

  // кадр: модель по центру, камера на оси z; размер подбирается так, чтобы монитор с ножкой влезал с полями
  const chord = 2 * (Rc + depth) * Math.sin(ph1);
  const modelW = chord + 0.12, modelH = yTop - yFloor + 0.14;
  const yMid = (yTop + yFloor) / 2;
  const FOV = 0.42;
  let vp = new Float32Array(16), eye = [0, 0, 1], dist = 5;

  return {
    /** высота холста к ширине: под эту пропорцию монитор с ножкой входит целиком */
    ratio: modelH / modelW,
    resize(W: number, H: number, dpr: number) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const aspectC = W / H;
      dist = Math.max(modelH / 2 / Math.tan(FOV / 2), modelW / 2 / (Math.tan(FOV / 2) * aspectC)) + 0.12;
      eye = [0, 0, dist];
      vp = mul(persp(FOV, aspectC, 0.1, 60), move(0, 0, -dist));
    },
    setTexture(src: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (src.width !== texW || src.height !== texH) {
        texW = src.width; texH = src.height;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
      }
    },
    draw(pose: MonitorPose) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // поворот вокруг центра экрана, потом весь монитор с ножкой — в центр кадра; push — дальше от зрителя
      const m = mul(move(0, -yMid, -pose.push), mul(rotX(pose.rx), rotY(pose.ry)));

      // мягкое: подсветка позади и тень, без глубины
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.useProgram(pSoft);
      gl.uniformMatrix4fv(L.soft.m, false, m);
      gl.uniformMatrix4fv(L.soft.vp, false, vp);
      bind(L.soft, P.soft);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform4f(L.soft.tint, 0.95, 0.62, 0.28, 0.16);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform4f(L.soft.tint, 0, 0, 0, 0.55);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      unbind();

      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(pSolid);
      gl.uniformMatrix4fv(L.solid.m, false, m);
      gl.uniformMatrix4fv(L.solid.vp, false, vp);
      gl.uniform3f(L.solid.eye, eye[0], eye[1], eye[2]);
      bind(L.solid, P.stand);
      gl.uniform3f(L.solid.color, 0.13, 0.14, 0.155);
      gl.uniform1f(L.solid.spec, 1);
      gl.uniform1f(L.solid.rim, 0.6);
      gl.drawElements(gl.TRIANGLES, P.stand.count, gl.UNSIGNED_SHORT, 0);
      bind(L.solid, P.body);
      gl.uniform3f(L.solid.color, 0.075, 0.08, 0.09);
      gl.uniform1f(L.solid.spec, 0.6);
      gl.uniform1f(L.solid.rim, 1);
      gl.drawElements(gl.TRIANGLES, P.body.count, gl.UNSIGNED_SHORT, 0);
      unbind();

      gl.useProgram(pScreen);
      gl.uniformMatrix4fv(L.screen.m, false, m);
      gl.uniformMatrix4fv(L.screen.vp, false, vp);
      gl.uniform3f(L.screen.eye, eye[0], eye[1], eye[2]);
      gl.uniform3f(L.screen.bezel, 0.075, 0.08, 0.09);
      gl.uniform1i(L.screen.tex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      bind(L.screen, P.screen);
      gl.drawElements(gl.TRIANGLES, P.screen.count, gl.UNSIGNED_SHORT, 0);
      unbind();
    },
    /** раскладка сменилась — модель собирается заново, старые буферы и программы освобождаются */
    dispose() {
      for (const part of Object.values(P)) { gl.deleteBuffer(part.buf); gl.deleteBuffer(part.idx); }
      gl.deleteTexture(tex);
      for (const p of [pSolid, pScreen, pSoft]) gl.deleteProgram(p);
    },
  };
}
