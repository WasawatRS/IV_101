'use client';
import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, DataTable, Slider, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { fmt } from "@/lib/math";
import { ComposedChart, Line } from "recharts";

const DELTA0 = 0.5;
const GAMMA = 0.02;
const MULT = 100;
const SHARES0 = 50;

const GRID: number[] = Array.from({ length: 121 }, (_, i) => -30 + i * 0.5);

const sg = (v: number, d = 0) => `${v >= 0 ? "+" : ""}${fmt(v, d)}`;

type Step = {
  step: number;
  event: string;
  dPrice: number;
  delta: number;
  short: number;
  netDelta: number;
  action: string;
  callPl: number;
  stockPl: number;
  pnl: number;
};

const STEPS: Step[] = [
  {
    step: 0,
    event: "จุดเริ่มต้น · Delta-neutral แล้ว",
    dPrice: 0,
    delta: 0.5,
    short: 50,
    netDelta: 0,
    action: "ตั้งสถานะ: Long 1 Call + Short 50 หุ้น",
    callPl: 0,
    stockPl: 0,
    pnl: 0,
  },
  {
    step: 1,
    event: "หุ้นขึ้น $10 โดย Gamma คงที่ 0.02",
    dPrice: 10,
    delta: 0.7,
    short: 50,
    netDelta: 20,
    action: "ยังไม่ปรับ ดูให้เห็นว่าหลุด Delta-neutral",
    callPl: 600,
    stockPl: -500,
    pnl: 100,
  },
  {
    step: 2,
    event: "ปรับ hedge ที่ราคาสูงขึ้น",
    dPrice: 10,
    delta: 0.7,
    short: 70,
    netDelta: 0,
    action: "Short เพิ่มอีก 20 หุ้น",
    callPl: 0,
    stockPl: 0,
    pnl: 100,
  },
  {
    step: 3,
    event: "หุ้นกลับลงมาที่จุดเริ่ม",
    dPrice: 0,
    delta: 0.5,
    short: 70,
    netDelta: -20,
    action: "ยังไม่ปรับ ดูให้เห็นว่าหลุดอีกครั้ง",
    callPl: -600,
    stockPl: 700,
    pnl: 200,
  },
  {
    step: 4,
    event: "ปรับ hedge ที่ราคาต่ำลง",
    dPrice: 0,
    delta: 0.5,
    short: 50,
    netDelta: 0,
    action: "ซื้อหุ้นคืน 20 ตัว",
    callPl: 0,
    stockPl: 0,
    pnl: 200,
  },
];

const STEP_HEAD = [
  "ขั้น",
  "เหตุการณ์",
  "Δราคา",
  "Delta",
  "Short",
  "Delta สุทธิ",
  "กระทำ",
  "Call P&L",
  "หุ้น P&L",
  "P&L สะสม",
];

const STEP_NUMERIC = [0, 2, 3, 4, 5, 7, 8, 9];

export default function GreeksPage() {
  const [ds, setDs] = useState(10);
  const [stepPick, setStepPick] = useState(1);
  const [dailyTheta, setDailyTheta] = useState(50);
  const [days, setDays] = useState(10);

  const { deltaNow, deltaShares, callPl, stockPl, netPl } = useMemo(() => {
    const delta = DELTA0 + GAMMA * ds;
    const shares = delta * MULT;
    const call = (DELTA0 * ds + 0.5 * GAMMA * ds * ds) * MULT;
    const stock = -SHARES0 * ds;
    return {
      deltaNow: delta,
      deltaShares: shares,
      callPl: call,
      stockPl: stock,
      netPl: call + stock,
    };
  }, [ds]);

  const deltaRows = useMemo(
    () =>
      GRID.map((x) => ({
        x,
        delta: DELTA0 + GAMMA * x,
        pt: x === ds ? DELTA0 + GAMMA * x : null,
      })),
    [ds]
  );

  const plRows = useMemo(
    () =>
      GRID.map((x) => {
        const net = (DELTA0 * x + 0.5 * GAMMA * x * x) * MULT - SHARES0 * x;
        return { x, net, pt: x === ds ? net : null };
      }),
    [ds]
  );

  const thetaCost = dailyTheta * days;
  const netAfterTheta = netPl - thetaCost;
  const cur = STEPS[stepPick];

  return (
    <>
      <PageHead
        chapter="บทที่ 3"
        title="Delta, Gamma และ Theta"
        source="จากโน้ต 03 (Greeks และ Gamma Scalping)"
      >
        <strong>Delta</strong> บอกความไวของราคา Option ต่อการเปลี่ยนแปลงของสินทรัพย์อ้างอิง,{" "}
        <strong>Gamma</strong> บอกว่า Delta เปลี่ยนเร็วแค่ไหน และ <strong>Theta</strong>{" "}
        คือผลของเวลาที่ผ่านไปต่อมูลค่า Option (ตามเงื่อนไขอื่นคงเดิม)
      </PageHead>

      <Callout tone="warn">
        <strong>ตัวอย่างสมมติ ไม่รวมต้นทุนทั้งหมด</strong> — ตัวเลขทุกตัวมาจากตัวอย่างใน PDF
        ยังไม่รวม Premium, Theta, ค่าใช้จ่าย, slippage และการเปลี่ยนแปลงของ IV
        จึงไม่ใช่ผลกำไรที่รับประกัน
      </Callout>

      <h2>ภาพจำง่าย</h2>
      <div className="grid cols-3">
        <div className="card">
          <h4>Delta</h4>
          <p>ความไวของราคา Option ต่อการเปลี่ยนของสินทรัพย์อ้างอิง และเป็นจำนวนหุ้นเทียบเท่า</p>
        </div>
        <div className="card">
          <h4>Gamma</h4>
          <p>บอกว่า Delta เปลี่ยนเร็วแค่ไหน ยิ่งสูง ยิ่งต้องปรับ hedge บ่อย</p>
        </div>
        <div className="card">
          <h4>Theta</h4>
          <p>ผลของเวลาที่ผ่านไปต่อมูลค่า Option เมื่อปัจจัยอื่นคงเดิม</p>
        </div>
      </div>

      <h2>1 · เลื่อนราคา แล้วดู Delta และ P&L โดยประมาณ</h2>

      <Slider
        label="ราคาเปลี่ยนจากจุดเริ่ม (ดอลลาร์)"
        value={ds}
        min={-30}
        max={30}
        step={1}
        onChange={setDs}
        format={(v) => sg(v)}
      />
      <Caption>ต้นฉบับไม่ได้ระบุราคาอ้างอิง จึงวัดเป็นระยะทางจากจุดเริ่ม</Caption>

      <div className="grid cols-4">
        <Stat label="Delta ของ Call" value={sg(deltaNow, 2)} />
        <Stat label="เทียบเท่าหุ้น" value={`${sg(deltaShares, 0)} หุ้น`} />
        <Stat label="Call P&L โดยประมาณ" value={`${sg(callPl, 0)} $`} />
        <Stat
          label="Net P&L ของสถานะ"
          value={`${sg(netPl, 0)} $`}
          hint={`หุ้น ${sg(stockPl, 0)} $`}
        />
      </div>

      <Caption>
        สูตรที่ใช้: <code>Call P&L ≈ (Delta × Δราคา + ½ × Gamma × Δราคา²) × 100</code>{" "}
        เป็นการประมาณเฉพาะจุด โดยละผลจากเวลา, IV และการเปลี่ยนแปลงของ Gamma
      </Caption>

      <div className="grid cols-2">
        <div>
          <h3 style={{ marginTop: 0 }}>Delta เปลี่ยนตามราคา (Gamma คงที่)</h3>
          <ChartBox height={300}>
            <ComposedChart data={deltaRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="Δราคา ($)" yLabel="Delta" yDomain={[-0.2, 1.2]} />
              <Line
                type="monotone"
                dataKey="delta"
                name="Delta"
                stroke={C.amber}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="pt"
                name="จุดปัจจุบัน"
                stroke="none"
                dot={{ r: 5, fill: C.violet, strokeWidth: 0 }}
                activeDot={false}
                isAnimationActive={false}
              />
              <Tt />
            </ComposedChart>
          </ChartBox>
        </div>
        <div>
          <h3 style={{ marginTop: 0 }}>Net P&L ของสถานะ Delta-neutral</h3>
          <ChartBox height={300}>
            <ComposedChart data={plRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <Grid />
              <Ax xLabel="Δราคา ($)" yLabel="Net P&L ($)" yDomain={[0, 900]} />
              <Line
                type="monotone"
                dataKey="net"
                name="Net P&L"
                stroke={C.up}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="pt"
                name="จุดปัจจุบัน"
                stroke="none"
                dot={{ r: 5, fill: C.violet, strokeWidth: 0 }}
                activeDot={false}
                isAnimationActive={false}
              />
              <Tt unit="$" />
            </ComposedChart>
          </ChartBox>
        </div>
      </div>

      <Caption>
        <strong>สังเกต:</strong> สถานะที่ปรับ hedge ให้เป็นศูนย์แล้ว มี P&L ตามรูปแบบกำลังสอง
        คือได้ทั้งตอนราคาขึ้นและตอนราคาลง — นี่คือสิ่งที่ Long Gamma ซื้อมา
      </Caption>

      <h2>2 · การปรับ hedge ทีละขั้น</h2>

      <Caption>เลื่อนเพื่อดูสถานะเปลี่ยนทีละขั้น ตามตัวอย่างหน้า 2–3 ของ PDF</Caption>

      <Slider
        label="ขั้น"
        value={stepPick}
        min={0}
        max={4}
        step={1}
        onChange={setStepPick}
        format={(v) => `ขั้น ${v}`}
      />

      <div className="card">
        <h4>
          ขั้นที่ {cur.step} · {cur.event}
        </h4>
        <Caption>{cur.action}</Caption>
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", margin: "14px 0 0" }}
        >
          <Stat label="ราคาเปลี่ยน" value={`${sg(cur.dPrice)} $`} />
          <Stat label="Delta ของ Call" value={fmt(cur.delta, 2)} />
          <Stat label="Short หุ้น" value={`${cur.short}`} />
          <Stat label="Delta สุทธิ" value={sg(cur.netDelta)} />
          <Stat label="P&L สะสม" value={`${sg(cur.pnl)} $`} />
        </div>
      </div>

      <DataTable
        head={STEP_HEAD}
        numeric={STEP_NUMERIC}
        rows={STEPS.map((s) => [
          s.step,
          s.event,
          s.dPrice,
          fmt(s.delta, 2),
          s.short,
          s.netDelta,
          s.action,
          s.callPl,
          s.stockPl,
          s.pnl,
        ])}
      />

      <Caption>
        ตัวอย่างนี้ Short เพิ่ม 20 หุ้นตอนราคาขึ้น แล้วซื้อคืน 20 หุ้นตอนราคาลง — หุ้นที่ซื้อขายรวมทั้งหมด
        40 หุ้น และ P&L สะสมเมื่อกลับมาที่จุดเริ่มต้นเท่ากับ 200 $
      </Caption>

      <Caption>
        ตัวเลข P&L คำนวณจากการประมาณเฉพาะจุด{" "}
        <strong>ไม่รวม Premium, Theta, ต้นทุน และ slippage</strong> ลำดับขั้นและตัวเลข Delta
        มาจากตัวอย่างใน PDF หน้า 2–3
      </Caption>

      <h2>3 · Theta เป็นต้นทุนที่สะสมตามเวลา</h2>

      <p>
        แสดงแยกออกจาก P&L ของ Gamma เพื่อให้เห็นว่า Long Gamma ไม่ได้กำไรฟรี แต่จ่ายค่าเสื่อมเวลาไปเรื่อย ๆ
      </p>

      <div className="controls">
        <Slider
          label="Theta ต่อวันที่คุณสมมติเอง (ดอลลาร์)"
          value={dailyTheta}
          min={0}
          max={1000}
          step={10}
          onChange={setDailyTheta}
          format={(v) => fmt(v, 0)}
        />
        <Slider
          label="จำนวนวันที่ถือ"
          value={days}
          min={0}
          max={30}
          step={1}
          onChange={setDays}
          format={(v) => `${v} วัน`}
        />
      </div>
      <Caption>
        เอกสารไม่ได้ให้ตัวเลข Theta ค่านี้จึงเป็นค่าที่คุณกรอกเองเพื่อการเรียน ไม่ได้มาจากต้นฉบับ
      </Caption>

      <Caption>
        Gamma P&L จากข้อ 1 ใช้ค่าที่เลื่อนไว้ (<strong>{sg(netPl, 0)} $</strong>) หักด้วย Theta ที่สะสม{" "}
        <strong>{fmt(thetaCost, 0)} $</strong>
      </Caption>

      <div className="grid cols-3">
        <Stat label="Gamma P&L" value={`${sg(netPl, 0)} $`} />
        <Stat label="Theta ที่สะสม" value={`-${fmt(thetaCost, 0)} $`} />
        <Stat label="คงเหลือหลังหัก Theta" value={`${sg(netAfterTheta, 0)} $`} />
      </div>

      {netPl === 0 ? (
        <Caption>
          <strong>ราคาไม่ขยับเลย → Gamma P&L เป็นศูนย์</strong> แต่ Theta ยังคงสะสมไปเรื่อย ๆ
          นี่คือกรณีที่เห็นชัดว่า Long Gamma ไม่ได้กำไรฟรี ต้องมีความเคลื่อนไหวมากพอจึงชดเชยค่าเวลาได้
        </Caption>
      ) : null}

      {netAfterTheta >= 0 ? (
        <Callout tone="ok">
          ความเคลื่อนไหวที่เลือกสร้าง Gamma P&L มากกว่า Theta ที่จ่ายไป เหลือสุทธิ{" "}
          {sg(netAfterTheta, 0)} $
        </Callout>
      ) : (
        <Callout tone="warn">
          Theta ที่จ่ายไป ({fmt(thetaCost, 0)} $) มากกว่า Gamma P&L ({sg(netPl, 0)} $) คงเหลือ{" "}
          {sg(netAfterTheta, 0)} $
        </Callout>
      )}

      <Caption>
        ตัวเลข Theta เป็นค่าที่คุณกรอกเอง <strong>ไม่ใช่ค่าจากเอกสาร</strong> และการประมาณนี้ยังคงไม่รวม
        Premium, ค่าใช้จ่าย, slippage และการเปลี่ยนของ IV
      </Caption>

      <h2>4 · เชื่อมกลับไปที่ IV เทียบ RV</h2>

      <p>
        เอกสารเสนอกรอบเปรียบเทียบคือ <strong>IV เทียบกับ RV</strong>
      </p>
      <ul className="plain">
        <li>
          การแกว่งจริง (RV) มากกว่าที่ตลาดตั้งราคา (IV) → Long Gamma อาจมีโอกาสชดเชย Theta ได้
        </li>
        <li>การแกว่งจริงน้อยกว่า → Theta อาจเป็นภาระต่อผู้ซื้อ Option</li>
      </ul>
      <p>แต่ผลจริงขึ้นกับราคาเข้า, โครงสร้างสัญญา, hedge, ต้นทุน และเส้นทางราคา</p>

      <div className="linkrow">
        <Link className="btn" href="/iv-vs-rv/">
          กลับไปดู IV เทียบ RV
        </Link>
      </div>

      <h2>ข้อจำกัดของบทนี้</h2>

      <div className="card">
        <p>
          <strong>Gamma P&L เป็นการประมาณเฉพาะจุด</strong> — ละผลจากเวลา, IV, การเปลี่ยนแปลงของ Gamma
          และปัจจัยอื่น
        </p>
        <p>
          <strong>Gamma ไม่ได้คงที่จริง</strong> — ตัวอย่างสมมติ Gamma = 0.02 ตลอด แต่ในตลาด Gamma
          เปลี่ยนตามราคาและเวลา โดยเฉพาะใกล้หมดอายุ
        </p>
        <p>
          <strong>ภาพตัวอย่างยังไม่ใช่ผลกำไร</strong> — ไม่รวม Premium, Theta, ค่าใช้จ่าย, slippage
          และการเปลี่ยนแปลงของ IV
        </p>
        <p>
          <strong>Theta ที่ใช้ในข้อ 3 เป็นค่าที่กรอกเอง</strong> — เอกสารไม่ได้ให้ตัวเลข
        </p>
      </div>

      <p className="small">
        ต้นฉบับ:{" "}
        <a href="/pdf/03_Part_2_The_Greeks.pdf#page=2">เปิด 03_Part_2_The_Greeks.pdf หน้า 2–3</a>
      </p>
    </>
  );
}
