'use client';
import { useMemo, useState } from "react";
import Link from "next/link";
import { Callout, PageHead, Stat, DataTable, Slider, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { fmt, makeGaussian, mulberry32, stdev } from "@/lib/math";
import { BarChart, ComposedChart, Bar, Legend, Line } from "recharts";

const N = 120;
const BASE = 4636;

const RAW: number[] = (() => {
  const rng = mulberry32(7);
  const gauss = makeGaussian(rng);
  const xs = Array.from({ length: N }, () => gauss());
  xs[0] = 0;
  return xs;
})();

function cumsum(xs: number[]): number[] {
  let c = 0;
  return xs.map((v) => (c += v));
}

function diffs(xs: number[]): number[] {
  return xs.slice(1).map((v, i) => v - xs[i]);
}

export default function MarketDynamicsPage() {
  const [g, setG] = useState(1);
  const [k, setK] = useState(0.6);

  const sim = useMemo(() => {
    const hedge = RAW.map((r) => -g * k * Math.sign(r));
    const actual = RAW.map((r, i) => r + hedge[i]);

    const pRaw = cumsum(RAW).map((v) => BASE + v);
    const pAct = cumsum(actual).map((v) => BASE + v);

    const volRaw = stdev(diffs(pRaw));
    const volAct = stdev(diffs(pAct));
    const ratio = volRaw > 0 ? volAct / volRaw : 0;

    const priceRows = RAW.map((_, i) => ({ x: i, raw: pRaw[i], act: pAct[i] }));

    const flowRows = RAW.map((_, i) => {
      const f = hedge[i];
      return {
        x: i,
        flow: f,
        buy: f > 0 ? f : null,
        sell: f < 0 ? f : null,
        none: f === 0 ? f : null,
      };
    });

    const allPrice = pRaw.concat(pAct);
    const lo = Math.min(...allPrice);
    const hi = Math.max(...allPrice);
    const pad = Math.max(2, (hi - lo) * 0.08);
    const priceDomain: [number, number] = [
      Math.floor((lo - pad) / 5) * 5,
      Math.ceil((hi + pad) / 5) * 5,
    ];

    const maxF = Math.max(...hedge.map((v) => Math.abs(v)), 0.05);
    const flowDomain: [number, number] = [-maxF * 1.25, maxF * 1.25];

    return { hedge, priceRows, flowRows, volRaw, volAct, ratio, priceDomain, flowDomain };
  }, [g, k]);

  const isLong = g > 0.15;
  const isShort = g < -0.15;
  const accent = isLong ? C.accent : isShort ? C.down : C.violet;

  const modeTitle = isLong ? (
    <>Long Gamma — เสร็จแล้ว hedge จะ <strong>ต้านราคา</strong></>
  ) : isShort ? (
    <>Short Gamma — เสร็จแล้ว hedge จะ <strong>ตามราคา</strong></>
  ) : (
    <>กลาง ๆ — ผลกระทบจากการ hedge แทบไม่มี</>
  );

  const modeDesc = isLong ? (
    <>ราคาเพิ่ม → <strong>ขาย</strong> · ราคาลด → <strong>ซื้อ</strong> จึงมีแรงต้านการเคลื่อนไหว</>
  ) : isShort ? (
    <>ราคาขึ้น → <strong>ซื้อ</strong> · ราคาลง → <strong>ขาย</strong> จึงเสริมการเคลื่อนไหว</>
  ) : (
    <>ไม่ต้าน ไม่เสริม</>
  );

  return (
    <>
      <PageHead
        chapter="บทที่ 5"
        title="Gamma, Flow และราคา"
        source="จากโน้ต 05 (Part 3 Market Microstructure)"
      >
        ทุกอย่างในหน้านี้เป็น<strong>ฉากจำลอง</strong> ไม่ใช่ข้อมูลราคาหรือสถานะจริง
      </PageHead>

      <Callout tone="info">
        การ hedge ของผู้ดูแลสภาพคล่อง<strong>อาจ</strong>สร้างแรงซื้อ/ขายในสินทรัพย์อ้างอิง
        แต่ทิศทางและขนาดขึ้นกับ<strong>สถานะจริง · ข้อมูลที่ใช้ · และวิธีประมาณ GEX</strong>
      </Callout>

      <h2>1 · ฉากจำลอง: Long Gamma ต้านราคา vs Short Gamma ตามราคา</h2>

      <div className="controls">
        <Slider
          label="สถานะ dealer"
          value={g}
          min={-1}
          max={1}
          step={0.1}
          onChange={setG}
          format={(v) => `${v > 0 ? "+" : ""}${fmt(v, 1)}`}
        />
        <Slider
          label="ความเข้มของการ hedge"
          value={k}
          min={0}
          max={0.9}
          step={0.05}
          onChange={setK}
          format={(v) => fmt(v, 2)}
        />
      </div>
      <Caption>-1 = Short Gamma สุดขั้ว · 0 = ไม่มีผลจาก hedge · +1 = Long Gamma สุดขั้ว</Caption>

      <h4 style={{ marginTop: 4, marginBottom: 2, fontSize: 17 }}>{modeTitle}</h4>
      <p>{modeDesc}</p>

      <ChartBox height={300}>
        <ComposedChart data={sim.priceRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <Grid />
          <Ax xLabel="ลำดับช่วงเวลา (จำลอง)" yLabel="ราคา (จำลอง)" yDomain={sim.priceDomain} />
          <Line
            dataKey="raw"
            name="ถ้าไม่มี dealer hedge"
            stroke={C.muted}
            strokeWidth={2.4}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="act"
            name="หลังรวมการ hedge"
            stroke={accent}
            strokeWidth={2.4}
            dot={false}
            isAnimationActive={false}
          />
          <Legend verticalAlign="top" height={30} />
          <Tt />
        </ComposedChart>
      </ChartBox>

      <ChartBox height={160}>
        <BarChart data={sim.flowRows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <Grid />
          <Ax xLabel="ลำดับช่วงเวลา (จำลอง)" yLabel="แรงจาก dealer" yDomain={sim.flowDomain} />
          <Bar dataKey="buy" name="dealer ซื้อ" fill={C.up} isAnimationActive={false} />
          <Bar dataKey="sell" name="dealer ขาย" fill={C.down} isAnimationActive={false} />
          <Bar dataKey="none" name="ไม่ทำอะไร" fill={C.muted} isAnimationActive={false} />
          <Legend verticalAlign="top" height={26} />
          <Tt />
        </BarChart>
      </ChartBox>

      <div className="grid cols-3">
        <Stat label="ความผันผวน · ไม่มี hedge" value={fmt(sim.volRaw, 3)} />
        <Stat label="ความผันผวน · หลังรวม hedge" value={fmt(sim.volAct, 3)} />
        <Stat label="สัดส่วน" value={`${fmt(sim.ratio, 2)}×`} />
      </div>

      <Callout tone="warn">
        <strong>
          ข้อมูล GEX เป็นการประมาณจากข้อมูล Options ไม่ใช่ข้อมูลสถานะ dealer ที่เห็นได้โดยตรง
        </strong>
        <br />
        <br />
        กราฟข้างบนเป็นฉากจำลองที่ผมตั้งสมมติฐานสถานะ dealer ให้เอง{" "}
        <strong>ไม่ได้มาจากข้อมูลตลาด</strong> จุดประสงค์คือให้เห็นกลไก
        ไม่ใช่ให้เชื่อว่าตลาดกำลังเป็นแบบนี้
      </Callout>

      <h2>2 · วิธี hedge สามแบบที่เอกสารเปรียบเทียบ</h2>

      <DataTable
        head={["วิธี", "เงื่อนไขการปรับ"]}
        rows={[
          ["Time-based", "ปรับ hedge ตามช่วงเวลาที่กำหนด"],
          ["Move / Band-based", "ปรับเมื่อราคาเคลื่อนเกิน band ที่ตั้งไว้ เช่น ระยะที่คำนวณจาก SD"],
          ["Delta-based", "ปรับเมื่อ Delta รวมเบี่ยงจากเป้าหมาย"],
        ]}
      />

      <Caption>
        การ hedge ต่อเนื่องเป็น<strong>สมมติฐานทางทฤษฎี</strong>{" "}
        ส่วนตลาดจริงมีต้นทุนและข้อมูลไม่ต่อเนื่อง
      </Caption>

      <div className="linkrow">
        <Link href="/beyond-theory/" className="btn ghost">
          ดูว่าต้นทุนและราคา gap ทำลาย Gamma Scalping ได้อย่างไร
        </Link>
      </div>

      <h2>3 · Pinning และตัวแปรที่ยังไม่ได้สร้าง</h2>

      <div className="card">
        <p style={{ margin: 0, color: "var(--fg)", fontSize: 15 }}>
          <strong>Pinning</strong> — บริเวณ strike/expiration
          อาจเห็นแรง hedge ที่ทำให้ราคาเคลื่อนไหวแคบลง
        </p>
        <Callout tone="warn">
          <strong>แต่ไม่รับประกันว่าราคาจะถูกตรึง</strong>
          <br />
          <br />
          การกล่าวว่า strike ใดจะ pin ต้องตรวจสอบข้อมูลและความเสี่ยงจริงก่อน
        </Callout>
      </div>

      <Caption>
        ต้นฉบับยังกล่าวถึง <strong>Vanna</strong> (Delta เปลี่ยนตาม IV) ·{" "}
        <strong>Charm</strong> (Delta เปลี่ยนตามเวลา) · <strong>volatility skew</strong> และ{" "}
        <strong>term structure</strong> — ทั้งหมดเชื่อมกับหน้าอื่นที่ทำไว้แล้ว
      </Caption>

      <div className="linkrow">
        <Link href="/vol-smile/" className="btn ghost">
          Volatility Smile / skew
        </Link>
        <Link href="/beyond-theory/" className="btn ghost">
          Vanna (Delta เปลี่ยนตาม IV)
        </Link>
      </div>

      <h2>4 · ข้อควรแยกจากข้อเท็จจริง</h2>

      <Callout
        tone="danger"
        title="คำอธิบาย Positive/Negative GEX เป็นกลไกตามสมมติฐานของสถานะและ hedge"
      >
        <ul className="plain" style={{ margin: 0 }}>
          <li>
            การรู้ OI หรือปริมาณ Call/Put <strong>อย่างเดียวไม่ยืนยัน</strong>
            ว่า dealer ฝั่งใดถือความเสี่ยงสุทธิ
          </li>
          <li>
            การกล่าวว่า strike ใดจะ pin หรือกลยุทธ์ใด <em>กินเงินเปล่า</em>{" "}
            <strong>ต้องตรวจสอบข้อมูลและความเสี่ยงจริงก่อน</strong>
          </li>
        </ul>
      </Callout>

      <p className="small">
        ต้นฉบับ: โน้ต 05 ·{" "}
        <a href="/pdf/05_Part_3_Market_Dynamics.pdf">เปิด 05_Part_3_Market_Dynamics.pdf</a>
      </p>
    </>
  );
}
