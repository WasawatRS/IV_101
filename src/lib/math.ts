/** เครื่องมือคำนวณร่วม — ทุกสูตรมาจากโน้ตใน vault */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller จาก generator ที่ระบุ seed */
export function makeGaussian(rng: () => number) {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.SQRT2 * Math.sqrt(Math.PI));
}

/** Abramowitz & Stegun 7.1.26 */
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = normalPdf(z);
  const p =
    d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/** ความหนาแน่นของ Laplace มาตรฐาน (ส่วนเบี่ยงเบนมาตรฐาน = 1) */
const LAP_B = 1 / Math.SQRT2;

export function laplacePdf(x: number): number {
  return Math.exp(-Math.abs(x) / LAP_B) / (2 * LAP_B);
}

export function laplaceCdf(x: number): number {
  return x < 0 ? 0.5 * Math.exp(x / LAP_B) : 1 - 0.5 * Math.exp(-x / LAP_B);
}

/** ความน่าจะเป็นว่าค่าจะอยู่ในช่วง ±k */
export function withinK(cdf: (x: number) => number, k: number): number {
  return cdf(k) - cdf(-k);
}

/** ระยะ Expected Move: ราคา × IV × √(DTE/365) */
export function expectedMove(price: number, ivPct: number, dte: number): number {
  return price * (ivPct / 100) * Math.sqrt(dte / 365);
}

/** ระยะต่อวัน: ราคา × IV ÷ √252 */
export function dailyMove(price: number, ivPct: number): number {
  return price * (ivPct / 100) / Math.sqrt(252);
}

export type OptionType = "call" | "put";

export interface BsResult {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  d1: number;
  d2: number;
}

/** Black–Scholes (แบบจ่ายปันผลต่อเนื่องเป็น 0) */
export function blackScholes(opts: {
  S: number;
  K: number;
  T: number;
  r: number;
  sigma: number;
  type: OptionType;
}): BsResult {
  const { S, K, T, r, sigma, type } = opts;
  const sqrtT = Math.sqrt(Math.max(T, 1e-9));
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const df = Math.exp(-r * T);
  const nd1 = normalCdf(d1);
  const nd2 = normalCdf(d2);

  const price =
    type === "call"
      ? S * nd1 - K * df * nd2
      : K * df * normalCdf(-d2) - S * normalCdf(-d1);

  const delta = type === "call" ? nd1 : nd1 - 1;
  const gamma = normalPdf(d1) / (S * sigma * sqrtT);
  const vega = (S * normalPdf(d1) * sqrtT) / 100;

  const thetaYear =
    type === "call"
      ? (-(S * normalPdf(d1) * sigma) / (2 * sqrtT) - r * K * df * nd2)
      : (-(S * normalPdf(d1) * sigma) / (2 * sqrtT) + r * K * df * normalCdf(-d2));

  return { price, delta, gamma, vega, theta: thetaYear / 365, d1, d2 };
}

/** หา IV ด้วย bisection — คืนค่าเป็นเปอร์เซ็นต์ */
export function impliedVol(opts: {
  S: number;
  K: number;
  T: number;
  r: number;
  marketPrice: number;
  type: OptionType;
}): number {
  let lo = 0.0001;
  let hi = 5;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const p = blackScholes({ ...opts, sigma: mid }).price;
    if (p > opts.marketPrice) hi = mid;
    else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length);
}

export function fmt(n: number, d = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function pct(n: number, d = 1): string {
  return `${fmt(n, d)}%`;
}
