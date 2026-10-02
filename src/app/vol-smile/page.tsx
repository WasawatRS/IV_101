'use client';
import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, DataTable, Toggle, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { fmt } from "@/lib/math";
import { ComposedChart, Line, Bar, Legend } from "recharts";

const FUTURE = 4636;
const IV_CENTER = 28;
const IV_PUT_WING = 42;
const IV_CALL_WING = 34.5;
const PCR = 4440 / 3702;
const WING_PUT_STRIKE = FUTURE - 160.9;
const WING_CALL_STRIKE = FUTURE + 166;

const sg = (v: number) => `${v >= 0 ? "+" : ""}${fmt(v, 1)}`;
const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

const HEADER_ROWS = [
  ["Put / Call", "4,440 / 3,702", "รวม Open Interest ทุก strike ของซีรีส์"],
  ["Vol", "28.25", "ความผันผวนรวมของซีรีส์ ระบุว่ามักเป็น ATM IV หรือ volatility settlement"],
  ["Vol Chg", "+0.01", "Vol ปัจจุบัน ลบ Vol settlement วันก่อน"],
  ["Future Chg", "+6.4", "ราคาฟิวเจอร์สปัจจุบัน ลบ settlement วันก่อน"],
  ["หัวเรื่อง", "OG1K6 · 0.63 DTE · 4636 (+6.4)", "ภาพขณะหนึ่ง ไม่ใช่ค่าคงที่ของตลาดทอง"],
];

type Band = { name: string; put: number; call: number };

const BANDS: Band[] = [
  { name: "25 Delta", put: 54.5, call: 54.5 },
  { name: "15 Delta", put: 108.0, call: 109.9 },
  { name: "5 Delta (tail / deep OTM)", put: 160.9, call: 166.0 },
];

/** ฟิตพาราโบลา degree 2 ผ่านสามจุด (Lagrange) */
function quadFit(
  xs: [number, number, number],
  ys: [number, number, number]
): (x: number) => number {
  const [x0, x1, x2] = xs;
  const [y0, y1, y2] = ys;
  return (x: number) =>
    (y0 * (x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2)) +
    (y1 * (x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2)) +
    (y2 * (x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
}

export default function VolSmilePage() {
  const [asym, setAsym] = useState(false);
  const [showSym, setShowSym] = useState(false);

  const bands = useMemo<Band[]>(() => {
    if (!asym) return BANDS;
    return BANDS.map((b) => {
      const mid = (b.put + b.call) / 2;
      return { ...b, put: mid, call: mid };
    });
  }, [asym]);

  const bandRows = useMemo(
    () =>
      bands.map((b) => ({
        x: b.name,
        span: [r1(-b.put), r1(b.call)],
        put: r1(-b.put),
        call: r1(b.call),
      })),
    [bands]
  );

  const smileRows = useMemo(() => {
    const fit = quadFit(
      [WING_PUT_STRIKE, FUTURE, WING_CALL_STRIKE],
      [IV_PUT_WING, IV_CENTER, IV_CALL_WING]
    );
    const symIv = IV_CENTER + (IV_PUT_WING - IV_CENTER);
    const symFit = quadFit(
      [WING_PUT_STRIKE, FUTURE, WING_CALL_STRIKE],
      [symIv, IV_CENTER, symIv]
    );
    const span = WING_CALL_STRIKE - WING_PUT_STRIKE;
    const grid = Array.from(
      { length: 120 },
      (_, i) => WING_PUT_STRIKE + (span * i) / 119
    );
    grid[0] = WING_PUT_STRIKE;
    grid[119] = WING_CALL_STRIKE;
    const xs = Array.from(new Set([...grid, FUTURE])).sort((a, b) => a - b);
    return xs.map((x) => ({
      x,
      iv: r2(fit(x)),
      sym: r2(symFit(x)),
      pt:
        x === WING_PUT_STRIKE
          ? IV_PUT_WING
          : x === FUTURE
            ? IV_CENTER
            : x === WING_CALL_STRIKE
              ? IV_CALL_WING
              : null,
    }));
  }, []);

  return (
    <>
      <PageHead
        chapter="บทที่ 6"
        title="Volatility Smile และแถบ Delta Ranges"
        source="จากโน้ต 16 (เครื่องมือ Vol2Vol บนหน้าจอ QuikStrike)"
      >
        ตัวเลขทั้งหมดเป็น <strong>ภาพขณะหนึ่งของสัญญา OG1K6 อายุ 0.63 DTE</strong>{" "}
        ไม่ใช่ค่าคงที่ของตลาดทอง
      </PageHead>

      <Callout tone="info" title="ไฟล์นี้สอนให้อ่านหน้าจอ ไม่ใช่รายงานผลทดสอบ">
        ตัวเลขทุกช่องมาจากภาพ QuikStrike ที่โน้ตบันทึกไว้
      </Callout>

      <h2>1 · ตัวเลขส่วนหัวและที่มาของแต่ละช่อง</h2>

      <DataTable
        head={["ช่องบนภาพ", "ค่าในตัวอย่าง", "เอกสารบอกว่ามาจากไหน"]}
        rows={HEADER_ROWS}
      />

      <div className="grid cols-2">
        <Stat label="Put/Call Ratio (คำนวณจากภาพ)" value={fmt(PCR, 2)} />
        <Stat label="จุดที่เมาส์ชี้บนกราฟ" value="Put 72 · Call 4 · Vol Settle 28.04" />
      </div>

      <Caption>
        <strong>เอกสารไม่ได้พิมพ์ PCR ไว้</strong> — {fmt(PCR, 2)} คำนวณจากยอด 4,440 / 3,702
        บนภาพเท่านั้น และ OI เป็นยอดคงค้างสะสม เอกสารย้ำว่า{" "}
        <strong>Intraday Volume สะท้อนแอคชันระหว่างวันได้แม่นกว่า</strong> ถ้านำไปทำโมเดล flow
      </Caption>

      <Caption>
        จุดที่เมาส์ชี้ (Put 72, Call 4, Vol Settle 28.04) คือ <strong>OI และ IV ของ strike นั้น</strong>{" "}
        ไม่ใช่ Vol 28.25 ของทั้งซีรีส์
      </Caption>

      <Callout tone="info">
        เอกสารระบุว่า IV ของ Options CME ในหน้านี้ถูก reverse engineer จากพรีเมียมด้วยโมเดล{" "}
        <strong>Bjerksund-Stensland 1993</strong> (American approximation)
        <br />
        <br />
        ข้อนี้เป็น<strong>คำอธิบายใน PDF ยังไม่ได้ตรวจกับคู่มือ QuikStrike แยกต่างหาก</strong>
      </Callout>

      <div className="divider" />

      <h2>2 · แถบ Delta Ranges — วัดระยะ ไม่ใช่ความน่าจะเป็น</h2>

      <p>
        แถบสีวัด<strong>ระยะเป็นจุดจาก ATM</strong> ออกไปยังระดับ Delta ระยะฝั่ง Call กับ Put{" "}
        <strong>ไม่เท่ากันทุกแถบ</strong>
      </p>

      <Toggle label="ลองปัดให้สมมาตร (ซึ่งเอกสารห้าม)" checked={asym} onChange={setAsym} />

      <ChartBox height={240}>
        <ComposedChart data={bandRows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <Grid />
          <Ax xLabel="แถบ Delta" yLabel="ระยะจาก ATM (จุด)" yDomain={[-180, 180]} />
          <Bar
            dataKey="span"
            name="ช่วงจาก ATM"
            fill={C.muted}
            isAnimationActive={false}
          />
          <Line
            dataKey="put"
            name="Put"
            stroke="none"
            dot={{ r: 5, fill: C.down, strokeWidth: 0 }}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="call"
            name="Call"
            stroke="none"
            dot={{ r: 5, fill: C.accent, strokeWidth: 0 }}
            activeDot={false}
            isAnimationActive={false}
          />
          <Legend />
          <Tt unit="จุด" />
        </ComposedChart>
      </ChartBox>

      <Caption>
        จุดสีแดงคือฝั่ง Put (ค่าติดลบ) จุดสีน้ำเงินคือฝั่ง Call (ค่าบวก) เส้นเทากลางคือช่วงระยะที่วัดได้
        จาก ATM ออกไปยังระดับ Delta นั้น
      </Caption>

      <DataTable
        head={["แถบ", "ฝั่ง Put", "ฝั่ง Call", "ผลต่าง Call − Put"]}
        numeric={[1, 2, 3]}
        rows={bands.map((b) => [b.name, fmt(b.put, 1), fmt(b.call, 1), sg(b.call - b.put)])}
      />

      {asym ? (
        <Callout tone="warn">
          นี่คือรูปทรง<strong>ที่เอกสารห้ามทำ</strong> — การปัดให้สมมาตรซ่อนความจริงว่า ระยะ tail
          ฝั่ง Call (166) ไกลกว่าฝั่ง Put (160.9) เอกสารสั่งตรง ๆ ว่า{" "}
          <em>ระยะฝั่ง Call กับ Put ไม่เท่ากันทุกแถบ อย่าปัดให้สมมาตร</em>
        </Callout>
      ) : (
        <Caption>
          ป้ายบนภาพต้นฉบับที่อ่านได้คือ 15, 25, 35, 45 Delta ทั้งสองฝั่ง และ 5ΔC ทางขวา เอกสารใช้แถบนี้เป็น
          <strong>มาตรวัดกรอบ Delta–Gamma และ tail risk โดยไม่ต้องคาดทิศทาง</strong>
        </Caption>
      )}

      <div className="divider" />

      <h2>3 · Volatility Smile และ put skew</h2>

      <p>
        เส้นประสีแดงบนภาพอิง<strong>แกนขวา</strong> (ประมาณ 27 ถึง 48) ไม่ได้อิงแกน OI ซ้าย
        แต่ละจุดคือ <strong>IV ของ strike นั้น ณ settlement</strong>
      </p>

      <ul className="plain">
        <li>
          ตรงกลาง (ใกล้ราคาฟิวเจอร์ส {fmt(FUTURE, 0)}) อยู่ต่ำสุดราว ๆ <strong>{fmt(IV_CENTER, 0)}</strong>
        </li>
        <li>
          ปีกซ้าย Deep OTM Put ยกไปราว ๆ <strong>{fmt(IV_PUT_WING, 0)}</strong>
        </li>
        <li>
          ปีกขวา Deep OTM Call ยกไปราว ๆ <strong>{fmt(IV_CALL_WING, 1)}</strong>
        </li>
      </ul>

      <Toggle label="เทียบกับทรงสมมาตร" checked={showSym} onChange={setShowSym} />

      <h3 style={{ marginTop: 0 }}>รูปทรง IV ตาม strike (สามจุดมาจากบันทึกในโน้ต)</h3>

      <ChartBox height={320}>
        <ComposedChart data={smileRows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <Grid />
          <Ax xLabel="Strike" yLabel="IV (%)" yDomain={[25, 45]} />
          <Line
            dataKey="iv"
            name="เส้นประ (ค่าประมาณ)"
            type="linear"
            stroke={C.muted}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
          {showSym ? (
            <Line
              dataKey="sym"
              name="ทรงสมมาตร"
              type="linear"
              stroke={C.accent}
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
          <Line
            dataKey="pt"
            name="สามจุดสีแดง"
            stroke="none"
            dot={{ r: 5, fill: C.down, strokeWidth: 0 }}
            activeDot={false}
            isAnimationActive={false}
          />
          <Tt unit="%" />
        </ComposedChart>
      </ChartBox>

      <Caption>
        <strong>สามจุดสีแดง</strong>คือค่าที่โน้ตบันทึกจากภาพ ส่วน<strong>เส้นประสีเทา</strong>
        ลากผ่านสามจุดเพื่อให้เห็นรูปทรง ค่าระหว่างจุดเป็นการประมาณ ไม่ได้วัดจากภาพ
      </Caption>

      <Caption>
        <strong>ระยะ strike คำนวณจากแถบ Delta Ranges ฝั่ง 5Δ</strong> ({fmt(FUTURE, 0)} − 160.9 ={" "}
        {fmt(WING_PUT_STRIKE, 1)} และ {fmt(FUTURE, 0)} + 166 = {fmt(WING_CALL_STRIKE, 1)}){" "}
        <strong>การจับคู่ปีก IV เข้ากับแถบ 5Δ เป็นการประมาณ ไม่ได้ระบุไว้ในเอกสาร</strong>
      </Caption>

      {showSym ? (
        <Callout tone="warn">
          เส้นสีฟ้าคือทรงที่ปีกทั้งสองข้างเท่ากัน — เอกสารเรียกทรงจริงว่า{" "}
          <strong>volatility smile</strong> และเรียกความไม่สมมาตรนี้ว่า <strong>put skew</strong>:
          ตลาดในภาพนี้ให้ราคาความเสี่ยงขาลงแพงกว่าขาขึ้น (ปีก Put {fmt(IV_PUT_WING, 0)} เทียบปีก Call{" "}
          {fmt(IV_CALL_WING, 1)})
        </Callout>
      ) : null}

      <Callout tone="warn">
        <strong>การอ่านนี้เป็นการวัดพรีเมียมที่เทรดแล้ว ไม่ใช่การพยากรณ์ว่าราคาจะลง</strong>
        <br />
        <br />
        put skew บอกว่าคนยอมจ่ายแพงกว่าสำหรับการป้องกันขาลง ไม่ได้บอกว่าราคาจะลงจริง
      </Callout>

      <Callout tone="warn">
        <strong>จุดที่ไม่ต้องฝืนให้ตรงกัน</strong> — เส้นประแนวตั้งของราคาอยู่ใกล้ป้ายแกนราว 4640
        ขณะที่หัวเรื่องระบุ 4636 <strong>อย่าฝืนให้เป็นเลขเดียวกันถ้าต้องใช้ต่อ</strong>
        <br />
        <br />
        และ Vol 28.25 ของซีรีส์ กับ Vol Settle 28.04 ของ strike ที่เมาส์ชี้{" "}
        <strong>เป็นคนละช่องกัน</strong>
      </Callout>

      <div className="divider" />

      <h2>4 · Exact Move และเหตุผลที่ต้องใช้เวลาคงเหลือจริง</h2>

      <p>หน้า 2 ของสไลด์มีสูตรสำหรับเวลาคงเหลือไม่ถึง 1 วัน</p>

      <pre>
        <code>Exact Move = Prior Settle × IV × √(DTE / 365)</code>
      </pre>

      <p>
        สไลด์ระบุว่าผลคือ<strong>ระยะ 1 SD ที่ความน่าจะเป็น 68.2%</strong>
      </p>

      <Callout tone="warn">
        68.2% เป็น<strong>สมมติฐานการแจกแจงปกติบนสไลด์ ไม่ใช่ความถี่ที่วัดจากทองคำ</strong>
        <br />
        <br />
        อายุ 0.63 DTE บนหัวภาพคือเหตุผลที่ต้องใช้เวลาคงเหลือจริง ไม่ใช่สูตรรายวันแบบ 1/√252
      </Callout>

      <div className="linkrow">
        <Link className="btn ghost" href="/expected-move/">
          กลับไปลองสูตรนี้ในห้องทดลอง Expected Move
        </Link>
      </div>

      <div className="divider" />

      <h2>5 · สิ่งที่ไฟล์นี้ยังไม่ทำให้</h2>

      <div className="grid cols-2">
        <div className="card">
          <h4>ยังไม่แสดงขั้นตอนสร้างกรอบ VOL2VOL ทั้งระบบ</h4>
          <Caption>นอกจากสูตร Exact Move และแถบ Delta</Caption>
        </div>
        <div className="card">
          <h4>ยังไม่พิสูจน์ว่า OI สูง = สถาบันจะป้องกัน strike นั้น</h4>
          <Caption>OI บอกแค่ยอดคงค้าง ไม่บอกใครถือ ทิศทางใด หรือจะ hedge อย่างไร</Caption>
        </div>
        <div className="card">
          <h4>แท็บ Churn ไม่มีนิยาม</h4>
          <Caption>Intraday, EOD, OI Change และ Churn ปรากฏบนภาพ แต่ข้อความไม่ได้ให้นิยาม Churn</Caption>
        </div>
        <div className="card">
          <h4>หน้า 4 ไม่มีเนื้อหา</h4>
          <Caption>ไฟล์ PDF มี 4 หน้า หน้าสุดท้ายว่าง</Caption>
        </div>
      </div>

      <p className="small">
        ต้นฉบับ: โน้ต 16 หน้า 1–3 ·{" "}
        <a href="/pdf/16_เครืองมือVol2Vol.pdf">เปิด 16_เครืองมือVol2Vol.pdf</a>
      </p>
    </>
  );
}
