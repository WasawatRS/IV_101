'use client';
import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, Slider, Segmented, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { fmt, makeGaussian, mean, mulberry32, pct } from "@/lib/math";
import { Area, Bar, BarChart, ComposedChart, Line, ReferenceLine } from "recharts";

const START_PRICE = 5000;
const BASE_VOL = 0.16;
const BINS = 40;
const SEED0 = 7;

type Pt = {
  x: number;
  price: number;
  upper: number;
  lower: number;
  mid: number;
  rv: number;
  iv: number;
  vrp: number;
  z: number;
};

const Q1_OPTIONS = [
  { value: "RV กำลังขยาย", label: "RV กำลังขยาย" },
  { value: "RV ต่ำผิดปกติ", label: "RV ต่ำผิดปกติ" },
  { value: "IV กำลังลดลง", label: "IV กำลังลดลง" },
];
const Q1_ANSWER = "RV ต่ำผิดปกติ";

const Q2_OPTIONS = [
  {
    value: "ตลาดกำลังเรียกร้องค่าความไม่แน่นอนมากกว่าที่เกิดขึ้นจริง",
    label: "ตลาดกำลังเรียกร้องค่าความไม่แน่นอนมากกว่าที่เกิดขึ้นจริง",
  },
  { value: "ตลาดทำนายผิด方向เสมอ", label: "ตลาดทำนายผิด方向เสมอ" },
  { value: "RV คำนวณผิด", label: "RV คำนวณผิด" },
];
const Q2_ANSWER = "ตลาดกำลังเรียกร้องค่าความไม่แน่นอนมากกว่าที่เกิดขึ้นจริง";

/** rolling mean / sample sd (ddof = 1) แบบ pandas — ข้ามค่า NaN และต้องมีอย่างน้อย minP จุด */
function rolling(a: number[], w: number, minP: number, kind: "mean" | "sd"): number[] {
  const out = new Array<number>(a.length).fill(NaN);
  for (let i = 0; i < a.length; i++) {
    const s = Math.max(0, i - w + 1);
    let n = 0;
    let sum = 0;
    let sumSq = 0;
    for (let j = s; j <= i; j++) {
      const v = a[j];
      if (Number.isFinite(v)) {
        n += 1;
        sum += v;
        sumSq += v * v;
      }
    }
    if (n < minP) continue;
    if (kind === "mean") {
      out[i] = sum / n;
    } else if (n >= 2) {
      const m = sum / n;
      out[i] = Math.sqrt(Math.max(sumSq / n - m * m, 0) * (n / (n - 1)));
    }
  }
  return out;
}

/** เติมค่าที่ว่างจากด้านหลัง (pandas .bfill()) */
function bfill(a: number[]): number[] {
  const out = a.slice();
  let last = NaN;
  for (let i = out.length - 1; i >= 0; i--) {
    if (Number.isFinite(out[i])) last = out[i];
    else out[i] = last;
  }
  return out;
}

/** เปอร์เซ็นไทล์แบบ linear interpolation (numpy ค่าเริ่มต้น) */
function percentile(xs: number[], q: number): number {
  const a = xs.slice().sort((m, n) => m - n);
  if (a.length === 0) return 0;
  const pos = (q / 100) * (a.length - 1);
  const base = Math.floor(pos);
  const rest = pos - base;
  if (base + 1 < a.length) return a[base] + rest * (a[base + 1] - a[base]);
  return a[base];
}

function domainOf(vals: number[], pad = 0.06): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of vals) {
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [0, 1];
  const span = hi - lo || Math.max(Math.abs(hi) * 0.2, 1);
  return [lo - span * pad, hi + span * pad];
}

function buildSeries(nDays: number, win: number, ivSpread: number, seed: number): Pt[] {
  const rng = mulberry32(seed >>> 0);
  const gauss = makeGaussian(rng);

  const targetDaily = BASE_VOL / Math.sqrt(252);
  const logTarget = Math.log(targetDaily);
  const logVol = new Array<number>(nDays);
  logVol[0] = logTarget;
  for (let t = 1; t < nDays; t++) {
    logVol[t] = 0.93 * logVol[t - 1] + 0.07 * logTarget + 0.05 * gauss();
  }

  const rets = new Array<number>(nDays);
  const price = new Array<number>(nDays);
  let p = START_PRICE;
  for (let t = 0; t < nDays; t++) {
    rets[t] = gauss() * Math.exp(logVol[t]);
    p = p * (1 + rets[t]);
    price[t] = p;
  }

  const mid = rolling(price, win, win, "mean");
  const sd = rolling(price, win, win, "sd");
  const rv = rolling(rets, win, win, "sd").map((v) => v * Math.sqrt(252));

  const expectWindow = Math.min(win * 3, nDays - 1);
  const rvExpected = bfill(rolling(rv, expectWindow, 5, "mean"));
  const noiseRng = makeGaussian(mulberry32((seed + 99) >>> 0));
  const iv = rvExpected.map((v) => Math.max(v * (1 + ivSpread) + noiseRng() * 0.01, 0.02));
  const vrp = iv.map((v, i) => v - rv[i]);
  const ivMa = rolling(iv, win, win, "mean");
  const ivSd = rolling(iv, win, win, "sd");

  const out: Pt[] = [];
  for (let i = 0; i < nDays; i++) {
    if (!Number.isFinite(mid[i])) continue;
    if (!Number.isFinite(sd[i])) continue;
    if (!Number.isFinite(rv[i])) continue;
    if (!Number.isFinite(iv[i])) continue;
    if (!Number.isFinite(ivMa[i]) || !Number.isFinite(ivSd[i])) continue;
    const z = (iv[i] - ivMa[i]) / ivSd[i];
    if (!Number.isFinite(z)) continue;
    out.push({
      x: 0,
      price: price[i],
      upper: mid[i] + 2 * sd[i],
      lower: mid[i] - 2 * sd[i],
      mid: mid[i],
      rv: rv[i],
      iv: iv[i],
      vrp: vrp[i],
      z,
    });
  }
  out.forEach((r, i) => {
    r.x = i + 1;
  });
  return out;
}

export default function IvVsRvPage() {
  const [win, setWin] = useState(20);
  const [ivSpread, setIvSpread] = useState(0.35);
  const [nDays, setNDays] = useState(180);
  const [seed, setSeed] = useState(SEED0);
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");

  const model = useMemo(() => {
    const pts = buildSeries(nDays, win, ivSpread, seed);
    const isShort = pts.length < 20;

    const bandRows = pts.map((r) => ({
      x: r.x,
      price: r.price,
      upper: r.upper,
      lower: r.lower,
      mid: r.mid,
      span: r.upper - r.lower,
    }));
    const ivrvRows = pts.map((r) => ({
      x: r.x,
      iv: r.iv,
      rv: r.rv,
      base: Math.min(r.iv, r.rv),
      gap: Math.abs(r.iv - r.rv),
      vrp: r.vrp,
    }));
    const zRows = pts.map((r) => ({ x: r.x, z: r.z }));
    const vrpRows = pts.map((r) => ({
      x: String(r.x),
      pos: r.vrp >= 0 ? r.vrp : 0,
      neg: r.vrp < 0 ? r.vrp : 0,
    }));

    const n = pts.length;
    const avgVrp = n > 0 ? mean(pts.map((r) => r.vrp)) : 0;
    const pctIvAbove = n > 0 ? (pts.filter((r) => r.vrp > 0).length / n) * 100 : 0;
    const maxIv = n > 0 ? Math.max(...pts.map((r) => r.iv)) : 0;
    const flipShare = n > 0 ? (pts.filter((r) => r.vrp < 0).length / n) * 100 : 0;
    const shareExtreme = n > 0 ? (pts.filter((r) => Math.abs(r.z) > 2).length / n) * 100 : 0;

    const prices = pts.map((r) => r.price);
    const pLo = n > 0 ? Math.min(...prices) : 0;
    const pHi = n > 0 ? Math.max(...prices) : 1;
    const binWidth = (pHi - pLo) / BINS || 1;
    const counts = new Array<number>(BINS).fill(0);
    for (const pr of prices) {
      let k = Math.floor((pr - pLo) / binWidth);
      if (k >= BINS) k = BINS - 1;
      if (k < 0) k = 0;
      counts[k] += 1;
    }
    const thHigh = percentile(counts, 75);
    const thLow = percentile(counts, 25);
    const profileRows = counts.map((c, k) => {
      const zone = c >= thHigh ? "hvn" : c <= thLow ? "lvn" : "middle";
      return {
        x: fmt(pLo + (k + 0.5) * binWidth, 0),
        hvn: zone === "hvn" ? c : 0,
        middle: zone === "middle" ? c : 0,
        lvn: zone === "lvn" ? c : 0,
      };
    });
    const profileMax = Math.max(1, ...counts);

    const bandVals: number[] = [];
    const ivrvVals: number[] = [];
    for (const r of pts) {
      bandVals.push(r.price, r.upper, r.lower, r.mid);
      ivrvVals.push(r.iv, r.rv);
    }
    const bandDomain = domainOf(bandVals, 0.06);
    const ivrvDomain = domainOf(ivrvVals, 0.06);
    const vrpDomain = domainOf([0, ...pts.map((r) => r.vrp)], 0.1);
    const zVals = pts.map((r) => r.z);
    const zLo = zVals.length ? Math.min(-2.5, Math.min(...zVals)) : -2.5;
    const zHi = zVals.length ? Math.max(2.5, Math.max(...zVals)) : 2.5;
    const zDomain: [number, number] = [zLo - 0.2, zHi + 0.2];

    return {
      pts,
      isShort,
      bandRows,
      ivrvRows,
      zRows,
      vrpRows,
      profileRows,
      profileMax,
      avgVrp,
      pctIvAbove,
      maxIv,
      flipShare,
      shareExtreme,
      bandDomain,
      ivrvDomain,
      vrpDomain,
      zDomain,
    };
  }, [nDays, win, ivSpread, seed]);

  return (
    <>
      <PageHead
        chapter="บทที่ 2"
        title="IV เทียบ RV"
        source="จากโน้ต 02 (The Volatility Lens) และ 15 (Standard Deviation)"
      >
        ทุกเส้นทางราคาในหน้านี้เป็น <strong>ข้อมูลสังเคราะห์เพื่อการเรียน (ข้อมูลจำลอง)</strong>{" "}
        ไม่ใช่ราคาในอดีต และ<strong>ไม่ใช่ข้อมูลตลาดจริง</strong>
      </PageHead>

      <Callout tone="info">
        สไลด์ต้นทางไม่ได้ระบุคาบของ Bollinger หรือจำนวนส่วนเบี่ยงเบน
        พารามิเตอร์ที่ใช้ในหน้านี้จึงเป็น <strong>ค่าที่เลือกเพื่อการสอน</strong>{" "}
        ไม่ใช่ค่าที่มาจากสไลด์
      </Callout>

      <h2>บทนี้ตอบอะไร</h2>
      <ul className="plain">
        <li>
          <strong>IV</strong> คือราคาที่ตลาดเรียกสำหรับความไม่แน่นอน — อยู่ฝั่ง{" "}
          <strong>ความคาดหวัง</strong>
        </li>
        <li>
          <strong>RV</strong> คือการแกว่งที่เกิดขึ้นจริงแล้ว — อยู่ฝั่ง <strong>ความจริง</strong>
        </li>
        <li>
          ส่วนต่าง IV − RV เรียกว่า <strong>VRP</strong> โดยปกติ IV สูงกว่า RV
        </li>
      </ul>

      <div className="card">
        <Caption>
          สไลด์หน้า 2 วาง IV ไว้ฝั่งความคาดหวัง ราคาพรีเมียม RV ไว้ฝั่งการแกว่งที่เกิดแล้ว
          และเรียกส่วนต่างว่า VRP โดยบอกว่า alpha อยู่ที่จังหวะที่ส่วนต่างผิดปกติ —{" "}
          <strong>ไม่มีตัวเลขส่วนต่างบนสไลด์</strong> และนั่นคือจุดยืนของสไลด์ ไม่ใช่ผลทดสอบ
        </Caption>
      </div>

      <div className="divider" />

      <h2>แผงควบคุม</h2>

      <div className="controls">
        <div className="field">
          <Slider
            label="หน้าต่างคำนวณ (วัน)"
            value={win}
            min={10}
            max={60}
            step={5}
            onChange={setWin}
            format={(v) => `${v} วัน`}
          />
          <p className="small" style={{ marginTop: 8 }}>
            หน้าต่างสำหรับค่าเฉลี่ยเคลื่อนที่ของ RV, Bollinger และ Z-score
          </p>
        </div>
        <div className="field">
          <Slider
            label="ส่วนต่าง IV เหนือ RV"
            value={ivSpread}
            min={0}
            max={1}
            step={0.05}
            onChange={setIvSpread}
            format={(v) => fmt(v, 2)}
          />
          <p className="small" style={{ marginTop: 8 }}>
            ยิ่งสูง ยิ่งเห็นช่องว่างระหว่างเส้นกว้าง
          </p>
        </div>
        <div className="field">
          <Slider
            label="จำนวนวันในชุดข้อมูล"
            value={nDays}
            min={80}
            max={300}
            step={20}
            onChange={setNDays}
            format={(v) => `${v} วัน`}
          />
        </div>
        <button
          type="button"
          className="btn ghost"
          style={{ alignSelf: "flex-end", cursor: "pointer" }}
          onClick={() => setSeed((s) => s + 1)}
        >
          สุ่มใหม่
        </button>
      </div>

      {model.isShort ? (
        <Callout tone="warn">
          หน้าต่างคำนวณยาวเกินไปเมื่อเทียบกับจำนวนวัน ลองลดหน้าต่างหรือเพิ่มจำนวนวัน
        </Callout>
      ) : (
        <>
          <h2>ชั้นที่ 1 · แถบที่กว้างตาม RV</h2>

          <p>ความกว้างของแถบใช้เป็นตัวแทนของ RV</p>
          <ul className="plain">
            <li>
              แถบ <strong>บีบแคบ</strong> = RV ต่ำผิดปกติ สไลด์เรียกว่าช่วงสะสมพลังงาน
            </li>
            <li>
              ราคาพุ่งทะลุขอบแล้วแถบ <strong>ถ่างเร็ว</strong> = RV กำลังขยาย
            </li>
          </ul>

          <h3 style={{ marginTop: 0 }}>
            ราคาสังเคราะห์กับแถบ ±2 SD (หน้าต่าง {win} วัน){" "}
            <span className="tag">ข้อมูลจำลอง · ไม่ใช่ข้อมูลตลาดจริง</span>
          </h3>

          <ChartBox height={300}>
            <ComposedChart data={model.bandRows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="วัน" yLabel="ราคา" yDomain={model.bandDomain} />
              <Area
                dataKey="lower"
                stackId="band"
                stroke="none"
                fill={C.accent}
                fillOpacity={0}
                isAnimationActive={false}
                tooltipType="none"
              />
              <Area
                dataKey="span"
                stackId="band"
                name="แถบ ±2 SD"
                stroke="none"
                fill={C.accent}
                fillOpacity={0.16}
                isAnimationActive={false}
                tooltipType="none"
              />
              <Line
                dataKey="upper"
                name="ขอบบน"
                stroke={C.accent}
                strokeOpacity={0}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="lower"
                name="ขอบล่าง"
                stroke={C.accent}
                strokeOpacity={0}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="mid"
                name="ค่าเฉลี่ยกลาง"
                stroke={C.accent}
                strokeWidth={1}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="price"
                name="ราคา"
                stroke={C.violet}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
              <Tt unit="จุด" />
            </ComposedChart>
          </ChartBox>

          <Caption>
            หน้าต่างที่ใช้: {win} วัน · จำนวนส่วนเบี่ยงเบน: 2 ·{" "}
            <strong>พารามิเตอร์เหล่านี้เลือกเพื่อการสอน ไม่ได้มาจากสไลด์</strong>{" "}
            (สไลด์ไม่ได้ระบุคาบหรือจำนวนส่วนเบี่ยงเบนบนภาพ)
          </Caption>

          <h2>ชั้นที่ 2 · เส้น IV และ RV</h2>

          <p>
            เส้นสีส้มคือ <strong>IV</strong> ที่ใส่ premium ให้สูงกว่า RV ตามที่สไลด์เรียกว่า VRP
            เส้นสีฟ้าคือ <strong>RV</strong> ที่วัดจากการแกว่งจริง พื้นที่สีส้มระหว่างสองเส้นคือส่วนต่าง
          </p>

          <h3 style={{ marginTop: 0 }}>
            IV (ส้ม) เทียบ RV (ฟ้า) · พื้นที่ส้มคือ VRP{" "}
            <span className="tag">ข้อมูลจำลอง · ไม่ใช่ข้อมูลตลาดจริง</span>
          </h3>

          <ChartBox height={300}>
            <ComposedChart data={model.ivrvRows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="วัน" yLabel="ความผันผวน (ต่อปี)" yDomain={model.ivrvDomain} />
              <Area
                dataKey="base"
                stackId="ivrv"
                stroke="none"
                fill={C.amber}
                fillOpacity={0}
                isAnimationActive={false}
                tooltipType="none"
              />
              <Area
                dataKey="gap"
                stackId="ivrv"
                name="ช่องว่าง IV − RV"
                stroke="none"
                fill={C.amber}
                fillOpacity={0.22}
                isAnimationActive={false}
                tooltipType="none"
              />
              <Line
                dataKey="rv"
                name="RV"
                stroke={C.accent}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="iv"
                name="IV"
                stroke={C.amber}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="vrp"
                name="IV − RV (VRP)"
                stroke={C.amber}
                strokeOpacity={0}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
              <Tt />
            </ComposedChart>
          </ChartBox>

          <div className="grid cols-3">
            <Stat label="VRP เฉลี่ยในชุดนี้" value={`${fmt(model.avgVrp * 100, 2)} จุดเปอร์เซ็นต์`} />
            <Stat label="สัดส่วนที่ IV สูงกว่า RV" value={pct(model.pctIvAbove, 0)} />
            <Stat label="ค่า IV สูงสุด" value={pct(model.maxIv * 100, 1)} />
          </div>

          <Caption>
            ตัวเลขข้างต้นคำนวณจาก <strong>ข้อมูลสังเคราะห์ชุดเดียวเท่านั้น</strong> ไม่ใช่ค่าตลาด
            และสไลด์ไม่ได้ให้ตัวเลข VRP อ้างอิงไว้
          </Caption>

          <p>เมื่อ RV พุ่งเกิน IV ช่องว่างจะกลับด้าน แถบสีฟ้าด้านล่างคือช่วงนั้น</p>

          <h3 style={{ marginTop: 0 }}>
            VRP รายวัน <span className="tag">ข้อมูลจำลอง · ไม่ใช่ข้อมูลตลาดจริง</span>
          </h3>

          <ChartBox height={300}>
            <BarChart data={model.vrpRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="วัน" yLabel="IV − RV" yDomain={model.vrpDomain} />
              <Bar
                dataKey="pos"
                stackId="vrp"
                name="IV สูงกว่า RV"
                fill={C.amber}
                isAnimationActive={false}
              />
              <Bar
                dataKey="neg"
                stackId="vrp"
                name="RV สูงกว่า IV"
                fill={C.accent}
                isAnimationActive={false}
              />
              <Tt />
            </BarChart>
          </ChartBox>

          <Caption>
            RV เกิน IV คิดเป็น {fmt(model.flipShare, 1)}% ของวันในชุดนี้ ช่วงนี้คือตอนที่สิ่งที่เกิดจริงแรงกว่าที่ตลาดเรียกราคาไว้
          </Caption>

          <h2>ชั้นที่ 3 · Z-score ของ IV</h2>

          <p>
            สูตรบนสไลด์คือ <code>Z = (X − μ) / σ</code> ใช้เทียบ IV ของสินทรัพย์ที่มีระดับต่างกัน
            เพราะเทียบค่าดิบตรง ๆ ไม่ได้ สไลด์ยกตัวอย่างหุ้นเทค IV 40% กับสาธารณูปโภค 15%{" "}
            <strong>สองตัวเลขนั้นเป็นตัวอย่างสอน ไม่ใช่ค่าตลาด</strong>
          </p>

          <h3 style={{ marginTop: 0 }}>
            Z-score ของ IV <span className="tag">ข้อมูลจำลอง · ไม่ใช่ข้อมูลตลาดจริง</span>
          </h3>

          <ChartBox height={300}>
            <ComposedChart data={model.zRows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="วัน" yLabel="Z" yDomain={model.zDomain} />
              <ReferenceLine
                y={2}
                stroke={C.muted}
                strokeDasharray="5 4"
                label={{ value: "+2σ", position: "insideLeft", fontSize: 11, fill: C.muted }}
              />
              <ReferenceLine
                y={1}
                stroke={C.muted}
                strokeDasharray="5 4"
                label={{ value: "+1σ", position: "insideLeft", fontSize: 11, fill: C.muted }}
              />
              <ReferenceLine
                y={0}
                stroke={C.muted}
                strokeDasharray="5 4"
                label={{ value: "0", position: "insideLeft", fontSize: 11, fill: C.muted }}
              />
              <ReferenceLine
                y={-1}
                stroke={C.muted}
                strokeDasharray="5 4"
                label={{ value: "-1σ", position: "insideLeft", fontSize: 11, fill: C.muted }}
              />
              <ReferenceLine
                y={-2}
                stroke={C.muted}
                strokeDasharray="5 4"
                label={{ value: "-2σ", position: "insideLeft", fontSize: 11, fill: C.muted }}
              />
              <Line
                dataKey="z"
                name="Z ของ IV"
                stroke={C.violet}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Tt />
            </ComposedChart>
          </ChartBox>

          <Caption>
            IV ที่อยู่นอก ±2σ คิดเป็น {fmt(model.shareExtreme, 1)}% ของวันในชุดนี้ ภายใต้การแจกแจงปกติควรอยู่ที่ราว 5% — ค่านี้มาจากข้อมูลสังเคราะห์ชุดเดียว ไม่ใช่ค่าตลาด
          </Caption>

          <h2>ชั้นที่ 4 · โปรไฟล์ปริมาณตามราคา</h2>

          <p>
            สไลด์บอกว่าการมอง RV ข้างหน้าต้องดูปริมาณตามราคา ไม่ใช่ตามเวลา ตลาดกระโดดจากโซนสภาพคล่องหนึ่งไปอีกโซนหนึ่ง
          </p>

          <h3 style={{ marginTop: 0 }}>
            จำนวนวันที่ราคาเคยอยู่แต่ละระดับ <span className="tag">ข้อมูลจำลอง · ไม่ใช่ข้อมูลตลาดจริง</span>
          </h3>

          <ChartBox height={300}>
            <BarChart data={model.profileRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax
                xLabel="ระดับราคา"
                yLabel="จำนวนวันที่ราคาเคยอยู่ระดับนี้"
                yDomain={[0, Math.round(model.profileMax * 1.1)]}
              />
              <Bar
                dataKey="hvn"
                stackId="profile"
                name="HVN · แกว่งแคบ RV ต่ำ"
                fill={C.up}
                isAnimationActive={false}
              />
              <Bar
                dataKey="middle"
                stackId="profile"
                name="โซนกลาง"
                fill={C.muted}
                isAnimationActive={false}
              />
              <Bar
                dataKey="lvn"
                stackId="profile"
                name="LVN · ช่องว่าง ราคาเคลื่อนเร็ว"
                fill={C.down}
                isAnimationActive={false}
              />
              <Tt unit="วัน" />
            </BarChart>
          </ChartBox>

          <div className="grid cols-2">
            <div className="card">
              <p>
                <strong>HVN และ PoC</strong> — ราคาแกว่งแคบ RV ต่ำ สไลด์เรียกว่า fair value และจัดเป็นโซนเก็บ Theta
              </p>
            </div>
            <div className="card">
              <p>
                <strong>LVN</strong> — ช่องว่างสภาพคล่อง ราคาเคลื่อนเร็ว RV พุ่ง สไลด์เรียกเป็นโซนระเบิดของ Gamma
              </p>
            </div>
          </div>

          <Caption>
            การแบ่งโซนในหน้านี้ใช้เปอร์เซ็นไทล์ของข้อมูลสังเคราะห์ สไลด์ไม่ได้กำหนดเกณฑ์แบ่ง HVN/LVN บนภาพ
          </Caption>

          <div className="divider" />

          <h2>คำถามทบทวน</h2>

          <Segmented
            label="1 · แถบบีบแคบผิดปกติบอกอะไรเกี่ยวกับ RV"
            options={Q1_OPTIONS}
            value={q1}
            onChange={setQ1}
          />
          {q1 === "" ? null : q1 === Q1_ANSWER ? (
            <Callout tone="ok">ถูก · สไลด์เรียกช่วงนี้ว่าช่วงสะสมพลังงาน</Callout>
          ) : (
            <Callout tone="danger">ยังไม่ถูก · แถบแคบหมายถึงการแกว่งจริงยังน้อย คือ RV ต่ำ</Callout>
          )}

          <Segmented
            label="2 · IV สูงกว่า RV อย่างมีนัย หมายความว่าอย่างไร"
            options={Q2_OPTIONS}
            value={q2}
            onChange={setQ2}
          />
          {q2 === "" ? null : q2 === Q2_ANSWER ? (
            <Callout tone="ok">ถูก · ส่วนต่างนี้คือ VRP โดยปกติ IV จะแพงกว่า RV</Callout>
          ) : (
            <Callout tone="danger">
              ยังไม่ถูก · IV เป็นราคาที่ตลาดเรียก RV เป็นสิ่งที่เกิดแล้ว ทั้งคู่ไม่ได้ 'ผิด'
            </Callout>
          )}

          <div className="divider" />

          <h2>ข้อจำกัดที่ห้ามลืม</h2>

          <div className="card">
            <p>
              <strong>ข้อมูลทั้งหมดในหน้านี้เป็นสังเคราะห์</strong> — สร้างจากเมล็ดสุ่ม ไม่ใช่ราคาในอดีต
              ห้ามเอาตัวเลขไปอ้างเป็นค่าตลาด
            </p>
            <p>
              <strong>แกนเวลาหน้า 6 และป้ายราคาหน้า 7 ของสไลด์ใช้ไม่ได้</strong> — หน้า 6 เรียงเวลาไม่ต่อกัน
              หน้า 7 ป้ายราคาไม่เรียง ทั้งสองหน้าเป็นภาพแนวคิด
            </p>
            <p>
              <strong>กลุ่มจุดเรียกว่า The Blob</strong> — สไลด์เรียกจุดที่หลุดออกจากกลุ่มว่า outlier
              และบอกว่า edge อยู่ที่ตรงนั้น{" "}
              <strong>นั่นคือจุดยืนของสไลด์ ไม่ใช่ผลทดสอบ</strong>
            </p>
            <p>
              <strong>ตัวอย่าง IV 40% และ 15% เป็นตัวเลขสอน</strong> — ไม่ใช่ค่าตลาด
            </p>
            <p>
              <strong>สูตร Position Size ใช้แทนเลขไม่ได้</strong> —{" "}
              <code>R / (σ × M × LastClose)</code> ยังไม่นิยาม R, หน่วย และ σ รายวันหรือรายปี
            </p>
          </div>

          <div className="linkrow">
            <Link className="btn ghost" href="/greeks/">
              ดูต่อที่ Delta, Gamma และ Theta
            </Link>
          </div>

          <p className="small">
            ต้นฉบับ: โน้ต 02 หน้า 2–5, หน้า 12–13 · โน้ต 15 ·{" "}
            <a href="/pdf/02_The_Volatility_Lens.pdf">เปิด 02_The_Volatility_Lens.pdf</a> ·{" "}
            <a href="/pdf/15_สูตรคำนวนSD.pdf">เปิด 15_สูตรคำนวนSD.pdf</a>
          </p>
        </>
      )}
    </>
  );
}
