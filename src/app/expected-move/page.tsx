'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, DataTable, Slider, Segmented, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { dailyMove, fmt, makeGaussian, mulberry32, normalPdf, pct } from "@/lib/math";
import { Area, ComposedChart, Line, ReferenceLine } from "recharts";

const N_STAT = 3000;
const N_DENSITY = 400;
const SEED0 = 11;

const CONFIDENCE: Record<number, string> = { 1: "68.0%", 2: "95.0%", 3: "99.7%" };
const THEORETICAL: Record<number, number> = { 1: 68.0, 2: 95.0, 3: 99.7 };

const DIST_NORMAL = "ปกติ — ตามสมมติฐานของสูตร";
const DIST_FAT = "หางหนา — fat tails";

const DIST_OPTIONS = [
  { value: DIST_NORMAL, label: DIST_NORMAL },
  { value: DIST_FAT, label: DIST_FAT },
];

const SD_OPTIONS = [
  { value: "1", label: "±1 SD" },
  { value: "2", label: "±2 SD" },
  { value: "3", label: "±3 SD" },
];

const NOTE_DAILY = dailyMove(5000, 16);

const r2 = (v: number) => Math.round(v * 100) / 100;

type PathRow = { x: number; [k: string]: number };

function simulateShape(nSteps: number, isNormal: boolean, seed: number) {
  const rng = mulberry32(seed >>> 0);
  const gauss = makeGaussian(rng);
  const inv = 1 / Math.sqrt(nSteps);
  const out = new Float64Array(N_STAT * nSteps);
  for (let i = 0; i < N_STAT; i++) {
    let acc = 0;
    for (let j = 0; j < nSteps; j++) {
      let z: number;
      if (isNormal) {
        z = gauss();
      } else {
        const a = gauss();
        const b = gauss();
        const c = gauss();
        const d = gauss();
        const v = Math.max((a * a + b * b + c * c + d * d) / 4, 1e-12);
        z = gauss() / Math.sqrt(v) / Math.SQRT2;
      }
      acc += z * inv;
      out[i * nSteps + j] = acc;
    }
  }
  return out;
}

export default function ExpectedMovePage() {
  const [spotRaw, setSpotRaw] = useState("6000");
  const [spot, setSpot] = useState(6000);
  const [iv, setIv] = useState(20);
  const [dte, setDte] = useState(30);
  const [sdPick, setSdPick] = useState(1);
  const [dist, setDist] = useState(DIST_NORMAL);
  const [nPaths, setNPaths] = useState(600);
  const [seed, setSeed] = useState(SEED0);

  const sigma = (iv / 100) * Math.sqrt(dte / 365);
  const em = spot * sigma;
  const up = spot + em;
  const down = Math.max(spot - em, 0);
  const nSteps = Math.max(dte, 2);
  const isNormal = dist.startsWith("ปกติ");
  const alive = sigma > 0;

  const shape = useMemo(
    () => simulateShape(nSteps, isNormal, seed),
    [nSteps, isNormal, seed]
  );

  const sim = useMemo(() => {
    const bandUp = spot * (1 + sigma * sdPick);
    const bandDown = Math.max(spot * (1 - sigma * sdPick), 0);
    let hit = 0;
    let stay = 0;
    for (let i = 0; i < N_STAT; i++) {
      const base = i * nSteps;
      const last = spot * Math.exp(sigma * shape[base + nSteps - 1]);
      if (last <= bandUp && last >= bandDown) hit += 1;
      let insideAll = true;
      for (let j = 0; j < nSteps; j++) {
        const p = spot * Math.exp(sigma * shape[base + j]);
        if (p > bandUp || p < bandDown) {
          insideAll = false;
          break;
        }
      }
      if (insideAll) stay += 1;
    }
    const hitRate = (hit / N_STAT) * 100;
    return {
      bandUp,
      bandDown,
      hitRate,
      escapeRate: 100 - hitRate,
      stayRate: (stay / N_STAT) * 100,
    };
  }, [shape, nSteps, spot, sigma, sdPick]);

  const pathChart = useMemo(() => {
    const rows: PathRow[] = [];
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < nSteps; j++) {
      const row: PathRow = { x: j, bandUp: sim.bandUp, bandDown: sim.bandDown };
      for (let i = 0; i < nPaths; i++) {
        const p = spot * Math.exp(sigma * shape[i * nSteps + j]);
        row[`p${i}`] = p;
        if (p < lo) lo = p;
        if (p > hi) hi = p;
      }
      rows.push(row);
    }
    lo = Math.min(lo, sim.bandDown, spot);
    hi = Math.max(hi, sim.bandUp, spot);
    const span = hi - lo || Math.max(Math.abs(hi) * 0.02, 1);
    const pad = span * 0.06;
    return { rows, yDomain: [lo - pad, hi + pad] as [number, number] };
  }, [shape, nSteps, nPaths, spot, sigma, sim]);

  const otherLines = useMemo(
    () =>
      Array.from({ length: Math.max(nPaths - 1, 0) }, (_, k) => k + 1).map((i) => (
        <Line
          key={`p${i}`}
          dataKey={`p${i}`}
          name={`เส้นทาง ${i + 1}`}
          stroke={C.muted}
          strokeOpacity={0.12}
          strokeWidth={1}
          dot={false}
          isAnimationActive={false}
          tooltipType="none"
        />
      )),
    [nPaths]
  );

  const density = useMemo(() => {
    const s = Math.max(sigma * spot, 1e-9);
    const lo = Math.max(spot - 3.5 * s, 0);
    const hi = spot + 3.5 * s;
    const xs: number[] = [];
    for (let i = 0; i < N_DENSITY; i++) {
      xs.push(r2(lo + ((hi - lo) * i) / (N_DENSITY - 1)));
    }
    const marks = [r2(spot), r2(up), r2(down)];
    const all = xs.concat(marks).sort((a, b) => a - b);
    const uniq: number[] = [];
    for (const v of all) {
      if (uniq.length === 0 || uniq[uniq.length - 1] !== v) uniq.push(v);
    }
    const rows = uniq.map((x) => {
      const d = normalPdf(x, spot, s);
      return { x, d, band: Math.abs(x - spot) <= s ? d : 0 };
    });
    return {
      rows,
      yTop: normalPdf(spot, spot, s) * 1.08,
      xSpot: r2(spot),
      xUp: r2(up),
      xDown: r2(down),
    };
  }, [spot, sigma, up, down]);

  const levelRows = useMemo(
    () =>
      [1, 2, 3].map((k) => {
        const band = spot * sigma * k;
        return [
          `±${k} SD`,
          CONFIDENCE[k],
          fmt(spot + band, 2),
          fmt(Math.max(spot - band, 0), 2),
          `±${fmt(band, 2)}`,
        ];
      }),
    [spot, sigma]
  );

  const theoretical = THEORETICAL[sdPick];
  const theoreticalEscape = 100 - theoretical;

  return (
    <>
      <PageHead
        chapter="บทที่ 1"
        title="ห้องทดลอง Expected Move"
        source="จากโน้ต 15 (Standard Deviation และกรอบราคา)"
      >
        แปลงความผันผวนที่ตลาดกำหนด (IV) เป็นช่วงราคาที่คาดหวัง ทุกค่าที่ใช้เป็นตัวเลขที่คุณกรอกเองเพื่อการเรียน ไม่ใช่ข้อมูลตลาดจริง
      </PageHead>

      <h2>สูตรและตัวอย่างจากโน้ต 15</h2>

      <Callout tone="info" title="สูตรที่ปรากฏในเอกสาร">
        <p style={{ marginTop: 0, marginBottom: 8 }}>
          <strong>Daily Expected Move:</strong> ระยะ 1 SD ต่อวัน ≈ ราคาอ้างอิง × IV ÷ √252
        </p>
        <p style={{ margin: "8px 0" }}>
          <strong>เวลาคงเหลือจริง (เช่น สัญญา 0DTE):</strong> ระยะ 1 SD ≈ ราคาอ้างอิง × IV × √(DTE ÷ 365)
        </p>
        <p style={{ margin: "8px 0 0" }}>
          โดย IV ต้องใส่เป็นทศนิยม เช่น 16% = 0.16 และ DTE เป็นจำนวนวันตามวิธีนับที่โมเดลกำหนด สูตรเป็นการประมาณภายใต้สมมติฐานของแบบจำลอง ไม่ใช่ขอบเขตราคาที่รับประกัน
        </p>
      </Callout>

      <div className="grid cols-3">
        <Stat label="ระยะ 1 SD ต่อวัน" value={`${fmt(NOTE_DAILY, 1)} จุด`} hint="5,000 × 0.16 ÷ √252" />
        <Stat label="กรอบ ±1 SD โดยประมาณ" value={`${fmt(5000 - NOTE_DAILY, 1)}–${fmt(5000 + NOTE_DAILY, 1)}`} />
        <Stat label="กรอบ ±2 SD โดยประมาณ" value={`${fmt(5000 - 2 * NOTE_DAILY, 1)}–${fmt(5000 + 2 * NOTE_DAILY, 1)}`} />
      </div>

      <Caption>
        ตัวอย่างสมมติ: ราคาตั้งต้น 5,000 จุด, IV 16% และใช้ 252 วันซื้อขาย — นี่เป็นตัวอย่างคณิตศาสตร์เพื่อการเรียน ไม่ใช่ค่าตลาดจริงหรือสัญญาณเข้าเทรด
      </Caption>

      <h2>1 · ป้อนค่า</h2>

      <div className="controls">
        <div className="field">
          <div className="field-head">
            <span>ราคาสินทรัพย์อ้างอิง</span>
            <span className="v">{fmt(spot, 2)}</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            aria-label="ราคาสินทรัพย์อ้างอิง"
            style={{ marginTop: 8 }}
            value={spotRaw}
            onChange={(e) => {
              const raw = e.target.value;
              setSpotRaw(raw);
              const n = Number(raw.replace(/,/g, ""));
              if (raw.trim() !== "" && Number.isFinite(n) && n >= 0) {
                setSpot(Math.max(0.01, n));
              }
            }}
          />
        </div>
        <div className="field">
          <Slider
            label="Implied Volatility (ต่อปี)"
            value={iv}
            min={1}
            max={300}
            step={1}
            onChange={setIv}
            format={(v) => `${v}%`}
          />
          <p className="small" style={{ marginTop: 8 }}>
            IV ที่ 20% ถือว่าปกติสำหรับดัชนี ส่วน 0DTE บางช่วงพุ่งเกิน 100%
          </p>
        </div>
        <div className="field">
          <Slider
            label="วันถึงครบกำหนด (DTE)"
            value={dte}
            min={0}
            max={60}
            step={1}
            onChange={setDte}
            format={(v) => `${v} วัน`}
          />
          <p className="small" style={{ marginTop: 8 }}>
            0 คือหมดอายุวันนี้ 30 คือเหลืออีกหนึ่งเดือน
          </p>
        </div>
      </div>

      <Caption>
        สูตรที่ใช้ในเอกสารต้นทาง: <strong>EM = ราคา × IV × √(DTE/365)</strong>
      </Caption>

      {!alive ? (
        <Callout tone="warn" title="Expected Move เป็นศูนย์เมื่อ DTE = 0 หรือ IV = 0">
          เลื่อนค่าใดค่าหนึ่งเพื่อดูตัวอย่าง
        </Callout>
      ) : (
        <>
          <h2>2 · ผลลัพธ์</h2>

          <div className="grid cols-4">
            <Stat label="Expected Move (±1 SD)" value={fmt(em, 2)} hint={`${fmt(sigma * 100, 2)}% ของราคา`} />
            <Stat label="ขอบบน +1 SD" value={fmt(up, 2)} hint={`+${fmt(em, 2)}`} />
            <Stat label="ขอบล่าง -1 SD" value={fmt(down, 2)} hint={`-${fmt(em, 2)}`} />
            <Stat label="ขอบกว้างทั้งหมด" value={fmt(2 * em, 2)} hint="±2 SD รวมกัน" />
          </div>

          <Caption>
            ภายใต้การแจกแจงปกติ ราคาปิดในช่วง ±1 SD ประมาณ <strong>68%</strong> ของเวลา ±2 SD ประมาณ <strong>95%</strong> และ ±3 SD ประมาณ <strong>99.7%</strong>
          </Caption>

          <Caption>
            ภายใต้การแจกแจงปกติ 1 SD มักสื่อถึงช่วงประมาณ 68% แต่ผลจริงอาจต่างจากสมมติฐานดังกล่าว โดยเฉพาะเมื่อมีหางหนา, jump, ข่าว หรือการเปลี่ยนแปลงของ volatility
          </Caption>

          <h2>3 · รูปทรงโอกาสตามราคา</h2>

          <ChartBox height={300}>
            <ComposedChart data={density.rows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="ราคา" yLabel="ความหนาแน่น" yDomain={[0, density.yTop]} />
              <Area
                dataKey="band"
                name="อยู่ใน ±1 SD"
                stroke="none"
                fill={C.amber}
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <Line
                dataKey="d"
                name="ความหนาแน่น"
                type="linear"
                stroke={C.violet}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine
                x={density.xSpot}
                stroke={C.accent}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{ value: `ราคาอ้างอิง ${fmt(spot, 0)}`, position: "insideTop", fontSize: 12, fontWeight: 600, fill: C.accent }}
              />
              <ReferenceLine
                x={density.xUp}
                stroke={C.up}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{ value: `+1 SD ${fmt(up, 0)}`, position: "insideTop", fontSize: 12, fontWeight: 600, fill: C.up }}
              />
              <ReferenceLine
                x={density.xDown}
                stroke={C.down}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{ value: `-1 SD ${fmt(down, 0)}`, position: "insideTop", fontSize: 12, fontWeight: 600, fill: C.down }}
              />
              <Tt />
            </ComposedChart>
          </ChartBox>

          <h2>4 · ระดับราคาที่คำนวณได้</h2>

          <DataTable
            head={["ชั้น", "ราคาปิดอยู่ในช่วงนี้", "ขอบบน", "ขอบล่าง", "ระยะจากจุดเริ่ม"]}
            numeric={[1, 2, 3, 4]}
            rows={levelRows}
          />

          <h2>5 · กรอบ SD บนกราฟราคาจำลอง</h2>

          <p>
            ปรับ <strong>ราคาตั้งต้น, IV, เวลาคงเหลือ และระดับ SD</strong> ได้จากแผงควบคุม แล้วดูกรอบถูกวาดลงบนกราฟทันที
          </p>

          <div className="controls">
            <Segmented label="ระดับ SD" options={SD_OPTIONS} value={String(sdPick)} onChange={(v) => setSdPick(Number(v))} />
            <Segmented label="รูปแบบการกระจายตัว" options={DIST_OPTIONS} value={dist} onChange={setDist} />
            <Slider
              label="จำนวนเส้นทาง"
              value={nPaths}
              min={100}
              max={1000}
              step={100}
              onChange={setNPaths}
              format={(v) => `${v} เส้น`}
            />
            <button
              type="button"
              className="btn ghost"
              style={{ alignSelf: "flex-end", cursor: "pointer" }}
              onClick={() => setSeed((s) => s + 1)}
            >
              สุ่มใหม่
            </button>
          </div>

          <h3>กรอบ SD กับเส้นทางราคาสังเคราะห์</h3>

          <ChartBox height={300}>
            <ComposedChart data={pathChart.rows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="วัน" yLabel="ราคา" yDomain={pathChart.yDomain} />
              <Area
                dataKey="bandUp"
                name={`กรอบ ±${sdPick} SD`}
                baseValue={sim.bandDown}
                stroke="none"
                fill={C.amber}
                fillOpacity={0.16}
                isAnimationActive={false}
              />
              {otherLines}
              <Line
                dataKey="p0"
                name="เส้นทางตัวอย่าง"
                type="linear"
                stroke={C.violet}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={spot}
                stroke={C.accent}
                strokeWidth={1.2}
                strokeDasharray="6 4"
                label={{ value: `จุดเริ่ม ${fmt(spot, 0)}`, position: "insideLeft", fontSize: 11, fontWeight: 600, fill: C.accent }}
              />
              <ReferenceLine
                y={sim.bandUp}
                stroke={C.up}
                strokeWidth={1.2}
                strokeDasharray="6 4"
                label={{ value: `+${sdPick} SD ${fmt(sim.bandUp, 0)}`, position: "insideLeft", fontSize: 11, fontWeight: 600, fill: C.up }}
              />
              <ReferenceLine
                y={sim.bandDown}
                stroke={C.down}
                strokeWidth={1.2}
                strokeDasharray="6 4"
                label={{ value: `-${sdPick} SD ${fmt(sim.bandDown, 0)}`, position: "insideLeft", fontSize: 11, fontWeight: 600, fill: C.down }}
              />
              <Tt unit="จุด" />
            </ComposedChart>
          </ChartBox>

          <h2>6 · ตัวเลขและสมมติฐานใต้กราฟ</h2>

          <div className="grid cols-4">
            <Stat label="กรอบที่เลือก" value={`±${sdPick} SD`} />
            <Stat label="ขอบบน" value={fmt(sim.bandUp, 2)} />
            <Stat label="ขอบล่าง" value={fmt(sim.bandDown, 2)} />
            <Stat label="แบบจำลอง" value={dist.split("—")[0].trim()} />
          </div>

          <div className="grid cols-4">
            <Stat label="ปิดในกรอบ" value={pct(sim.hitRate, 1)} hint={`โมเดลบอก ${pct(theoretical, 1)}`} />
            <Stat label="หลุดกรอบ" value={pct(sim.escapeRate, 1)} hint={`โมเดลบอก ${pct(theoreticalEscape, 1)}`} />
            <Stat label="ไม่หลุดกรอบเลยตลอดช่วง" value={pct(sim.stayRate, 1)} />
            <Stat label="จำนวนเส้นทาง" value={`${nPaths} / ${fmt(N_STAT, 0)}`} />
          </div>

          <Caption>
            กราฟวาด <strong>{nPaths} เส้นแรก</strong> แต่ตัวเลขทั้งหมดคำนวณจาก <strong>{fmt(N_STAT, 0)} เส้นทาง</strong> เพื่อลดความผันพลาดจากการสุ่ม
          </Caption>

          {isNormal ? (
            <Callout tone="info">
              <strong>เส้นทางชุดนี้สร้างจากสมมติฐานเดียวกับสูตร</strong> ผลจึงมักใกล้ค่าที่โมเดลบอกอยู่แล้ว <strong>นั่นไม่ใช่การทดสอบสูตร และไม่ใช่หลักฐานว่าตลาดจริงเป็นเช่นนั้น</strong> การจะรู้ว่าตลาดจริงหลุดกรอบบ่อยแค่ไหน ต้องใช้ราคาจริง ซึ่งหน้านี้ไม่มี
            </Callout>
          ) : sdPick === 3 ? (
            <Callout tone="info">
              หลุดกรอบ {pct(sim.escapeRate, 1)} เทียบกับที่โมเดลบอก {pct(theoreticalEscape, 1)} <strong>ความต่างของหางหนาเห็นชัดที่ระดับไกลอย่าง ±3 SD</strong> โน้ต 19 แนะนำให้ stress test ที่ 3–4 SD เพราะ jump ไม่ได้อยู่ในการแจกแจงปกติ
            </Callout>
          ) : (
            <Callout tone="info">
              ที่ ±{sdPick} SD ตัวเลขของทั้งสองแบบอาจยังใกล้เคียงกัน <strong>ลองเปลี่ยนเป็น ±3 SD เพื่อเห็นว่าหางหนาทำให้หลุดกรอบบ่อยกว่าที่โมเดลบอก</strong>
            </Callout>
          )}

          <div className="card">
            <h4>สมมติฐานที่ใช้ในกราฟนี้</h4>
            <ul className="plain">
              <li>ราคาตั้งต้น {fmt(spot, 2)} · IV {fmt(iv, 0)}% · DTE {dte} วัน</li>
              <li>กรอบ ±{sdPick} SD คำนวณจากสูตรเชิงเส้นของเอกสาร: <code>ราคา × IV × √(DTE ÷ 365)</code> = {fmt(sim.bandUp - spot, 2)} จุด</li>
              <li>เส้นทางสร้างในแบบ<strong>ลอการิทึม</strong> (geometric) เพื่อไม่ให้ราคาติดลบ จึงไม่ตรงกับสูตรเชิงเส้นที่ใช้วาดกรอบ</li>
              <li>ช่วงเวลาแบ่งเป็น {nSteps} ขั้น แต่ละขั้นกระจายตัวอิสระ — <strong>ไม่มี volatility clustering</strong></li>
              <li>รูปแบบกระจายตัวที่เลือก: <strong>{dist}</strong></li>
              <li>ทุกตัวเลขมาจากข้อมูลสังเคราะห์ชุดนี้ <strong>ไม่ใช่ราคาในอดีตและไม่ใช่ค่าตลาด</strong></li>
            </ul>
          </div>

          <h2>7 · ข้อจำกัดที่ต้องจำไว้</h2>

          <div className="card">
            <h4>1. สมมติการกระจายตัวแบบปกติ แต่ตลาดไม่เป็นเช่นนั้น</h4>
            <p>ตลาดมีหางหนา (fat tails) ราคาเคลื่อนที่ไกลกว่าที่ ±3 SD บอกไว้บ่อยครั้ง โดยเฉพาะช่วงมีข่าว ดูรายละเอียดในโน้ต 17</p>
            <h4>2. IV เป็นราคาที่ตลาดตั้ง ไม่ใช่คำทำนาย</h4>
            <p>IV บอกว่าตลาดยอมจ่ายเท่าไรสำหรับความไม่แน่นอน ไม่ได้บอกว่าราคาจะไปทางไหน โน้ต 19 แยก RV กับ IV ไว้ชัดเจน</p>
            <h4>3. Smile ทำให้ IV ไม่ใช่ค่าเดียวทั้งช่วงราคา</h4>
            <p>OTM option ต่างฝั่งมี IV ต่างกัน ทำให้รูปทรงจริงไม่ใช่ระฆังสมมาตร โน้ต 16 อธิบาย Volatility Smile และ Skew</p>
            <h4>4. ตัวเลขจากสไลด์ขัดกันเอง</h4>
            <p>เอกสารต้นทางมีหลายชุดที่ให้ค่าไม่ตรงกัน จงอ่านข้อจำกัดในโน้ตประกอบเสมอ</p>
          </div>

          <Caption>แหล่งข้อมูล: โน้ต 15, 16, 17, 19 · สูตร EM มาจากบทเรื่อง Expected Move ในสไลด์</Caption>

          <div className="linkrow">
            <Link className="btn ghost" href="/glossary/">
              ศัพท์และแผนที่โน้ต 23 ฉบับ
            </Link>
          </div>
        </>
      )}
    </>
  );
}
