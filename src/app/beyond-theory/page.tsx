'use client';

import { useMemo, useState } from "react";
import { Callout, PageHead, Stat, Slider, Segmented, Caption } from "@/components/ui";
import { C, ChartBox, Grid, Ax, Tt } from "@/components/chartkit";
import { blackScholes, fmt, pct } from "@/lib/math";
import { ComposedChart, BarChart, Line, Bar, Area } from "recharts";

const BASE_PRICE = 100;
const BAND = 5;
const N_DAYS = 10;
const MULT = 100;
const GROSS = 200;

const MODE_CONTINUOUS = "ราคาเคลื่อนต่อเนื่อง";
const MODE_GAP = "ราคา gap ข้าม band";

const signed = (v: number, d: number) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}`;

type MarkerPt = { cx?: number | string; cy?: number | string };

function markerXY(p: MarkerPt) {
  const x = Number(p.cx);
  const y = Number(p.cy);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function triangleDot(p: MarkerPt) {
  const pt = markerXY(p);
  if (!pt) return null;
  const s = 7;
  const { x, y } = pt;
  return (
    <polygon
      points={`${x},${y - s} ${x + s * 0.866},${y + s * 0.5} ${x - s * 0.866},${y + s * 0.5}`}
      fill={C.down}
    />
  );
}

function squareDot(p: MarkerPt) {
  const pt = markerXY(p);
  if (!pt) return null;
  const s = 5;
  const { x, y } = pt;
  return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} fill={C.up} />;
}

export default function BeyondTheoryPage() {
  const [mode, setMode] = useState<string>(MODE_CONTINUOUS);
  const [costPerShare, setCostPerShare] = useState(0.05);
  const [shares, setShares] = useState(40);
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [tDays, setTDays] = useState(30);
  const [ivBase, setIvBase] = useState(25);
  const [ivShift, setIvShift] = useState(10);
  const [rate, setRate] = useState(0);

  const sim = useMemo(() => {
    const continuous = mode === MODE_CONTINUOUS;
    const rows = Array.from({ length: N_DAYS + 1 }, (_, i) => {
      const price = continuous
        ? BASE_PRICE + (BAND * i) / N_DAYS
        : i === N_DAYS
          ? BASE_PRICE + BAND
          : BASE_PRICE;
      return {
        x: i,
        price,
        band: BASE_PRICE + BAND,
        hedge: continuous && i >= 1 && i <= N_DAYS ? price : null,
        jump: !continuous && i === N_DAYS ? price : null,
        start: i === 0 ? price : null,
      };
    });
    return {
      continuous,
      rows,
      hedgeCount: continuous ? N_DAYS : 0,
      event: continuous
        ? "ราคาขยับทีละน้อย ขั้นละ $0.50 ตลอด 10 วัน"
        : "ราคานิ่ง 9 วัน แล้วกระโดดข้าม band ครั้งเดียวในวันสุดท้าย",
      endPrice: rows[rows.length - 1].price,
    };
  }, [mode]);

  const cost = useMemo(() => {
    const totalCost = shares * costPerShare;
    const net = GROSS - totalCost;
    const costPct = GROSS > 0 ? (totalCost / GROSS) * 100 : 0;
    const costRows = [
      { x: "กำไรดิบ", "กำไรดิบ": GROSS, "ต้นทุน": 0 },
      { x: "ต้นทุน", "กำไรดิบ": 0, "ต้นทุน": totalCost },
    ];
    const yMax = Math.max(GROSS, totalCost) * 1.15;
    return { totalCost, net, costPct, costRows, yMax };
  }, [shares, costPerShare]);

  const bs = useMemo(() => {
    const r = rate / 100;
    const t = tDays / 365;
    const ivA = ivBase / 100;
    const ivB = Math.max(ivBase + ivShift, 0.5) / 100;
    const deltaA = blackScholes({ S: spot, K: strike, T: t, r, sigma: ivA, type: "call" }).delta;
    const deltaB = blackScholes({ S: spot, K: strike, T: t, r, sigma: ivB, type: "call" }).delta;
    const diff = deltaB - deltaA;
    return { deltaA, deltaB, diff, sharesEquiv: diff * MULT };
  }, [spot, strike, tDays, ivBase, ivShift, rate]);

  return (
    <>
      <PageHead
        chapter="บทที่ 4"
        title="เมื่อโมเดลเจอตลาดจริง"
        source="จากโน้ต 04 (Beyond Theory)"
      />

      <Callout tone="info">
        {`Black–Scholes เป็น`}
        <strong>แผนที่</strong>
        {`ช่วยคิดเรื่อง Greeks แต่ไม่ได้จำลองทุกสิ่งที่เกิดจริง เช่น ราคา gap, fat tails, bid–ask spread, slippage และ IV ที่เปลี่ยนพร้อมกับราคา`}
      </Callout>

      <h2>สิ่งที่หน้านี้ทำ</h2>
      <ol className="plain">
        <li>{`จำลอง `}<strong>ราคาเคลื่อนต่อเนื่อง</strong>{` เทียบกับ `}<strong>ราคา gap ข้าม band</strong></li>
        <li>{`เครื่องคิดเลข Gamma Scalping ที่`}<strong>เพิ่มต้นทุน</strong>{` และเทียบผลก่อน–หลัง`}</li>
        <li>{`เทียบ `}<strong>Delta ปกติ</strong>{` กับ `}<strong>Delta หลัง IV เปลี่ยน</strong>{` เพื่อสอนว่า Greeks เป็นค่าตามสถานการณ์`}</li>
      </ol>

      <h2>1 · ราคาเคลื่อนต่อเนื่อง เทียบกับ ราคา gap</h2>

      <div className="controls">
        <Segmented
          label="รูปแบบการเคลื่อนไหว"
          options={[
            { value: MODE_CONTINUOUS, label: MODE_CONTINUOUS },
            { value: MODE_GAP, label: MODE_GAP },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <p className="small">{sim.event}</p>

      <ChartBox height={300}>
        <ComposedChart data={sim.rows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <Grid />
          <Ax xLabel="วัน" yLabel="ราคา ($)" yDomain={[90, 110]} />
          <Area
            dataKey="band"
            name="บน"
            baseValue={BASE_PRICE - BAND}
            stroke="none"
            fill={C.amber}
            fillOpacity={0.14}
            isAnimationActive={false}
          />
          <Line
            dataKey="price"
            name="ราคา"
            type="linear"
            stroke={C.violet}
            strokeWidth={2.4}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="hedge"
            name="จุดที่มีโอกาสปรับ hedge"
            stroke="none"
            dot={{ r: 5, fill: C.accent, stroke: "none" }}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="jump"
            name="จุดที่ราคากระโดดข้าม band"
            stroke="none"
            dot={triangleDot}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="start"
            name="จุดเริ่ม"
            stroke="none"
            dot={squareDot}
            activeDot={false}
            isAnimationActive={false}
          />
          <Tt unit="$" />
        </ComposedChart>
      </ChartBox>

      <div className="grid cols-3">
        <Stat label="จุดเริ่ม" value={`$${fmt(BASE_PRICE, 0)}`} />
        <Stat label="จุดที่ถึง" value={`$${fmt(sim.endPrice, 0)}`} />
        <Stat label="โอกาสปรับ hedge ระหว่างทาง" value={`${sim.hedgeCount} ครั้ง`} />
      </div>

      <Caption>{`สัญลักษณ์:  ● จุดที่มีโอกาสปรับ hedge  ·  ▲ จุดที่ราคากระโดดข้าม band ·  ■ จุดเริ่ม`}</Caption>

      {sim.continuous ? (
        <Callout tone="ok">
          {`ราคาเดินเข้าหาขอบทีละขั้น `}
          <strong>คุณเห็นและปรับ hedge ได้ระหว่างทาง</strong>
          {` ทุกครั้งที่ปรับ คุณขายตอนราคาสูงและซื้อคืนตอนต่ำ — นั่นคือ Gamma ที่เก็บได้`}
        </Callout>
      ) : (
        <Callout tone="danger">
          {`ราคากระโดดข้าม band โดยไม่ผ่านจุดกลางระหว่างทาง `}
          <strong>ไม่มีจุดให้ปรับ hedge เลย</strong>
          {` ระดับที่ตั้งใจ hedge ไว้ถูกข้ามไป ผลของ Gamma ที่คำนวณไว้จึงไม่เกิดขึ้นตามที่โมเดลบอก`}
        </Callout>
      )}

      <div className="card">
        <p><strong>{`Gap และ Jump Risk`}</strong>{` — ราคาสามารถกระโดดข้ามระดับที่ตั้งใจ hedge ได้ โดยเฉพาะข้ามคืน, วันหยุด หรือช่วงข่าว`}</p>
        <p><strong>{`สิ่งที่การประมาณไม่ได้`}</strong>{` — สูตร `}<code>½ × Gamma × Δราคา²</code>{` สมมติว่าคุณได้ปรับ hedge ตามราคาที่เปลี่ยน เมื่อราคากระโดด สมมติฐานนี้พังลง`}</p>
      </div>

      <Caption>{`ราคาเริ่มและขนาด band ในหน้านี้เป็น`}<strong>ตัวเลขเพื่อการสอน</strong>{` ไม่ใช่ค่าตลาด ทั้งสองกรณีจบเท่ากันที่จุดเดียวกัน ต่างกันที่`}<strong>เส้นทาง</strong>{`เท่านั้น`}</Caption>

      <h2>2 · Gamma Scalping หลังหักต้นทุน</h2>

      <p>{`ตัวอย่างจากโน้ต 03: ปรับ hedge 2 ครั้ง ขาละ 20 หุ้น → `}<strong>{`รวม ${20 + 20} หุ้นที่ซื้อขาย`}</strong></p>
      <p>{`กำไรดิบจากการประมาณเฉพาะจุด = `}<strong>{`200 $`}</strong>{` (ก่อนหักต้นทุน)`}</p>

      <div className="controls">
        <div className="field">
          <Slider
            label="ต้นทุนต่อหุ้น (spread + commission + slippage)"
            value={costPerShare}
            min={0}
            max={0.5}
            step={0.01}
            onChange={setCostPerShare}
            format={(v) => `${v.toFixed(2)} $`}
          />
          <p className="small" style={{ marginTop: 8 }}>{`ค่าที่คุณกรอกเองเพื่อการเรียน ไม่ใช่ค่าตลาด`}</p>
        </div>
        <div className="field">
          <Slider
            label="จำนวนหุ้นที่ซื้อขายจากการ hedge"
            value={shares}
            min={40}
            max={600}
            step={20}
            onChange={setShares}
            format={(v) => `${v} หุ้น`}
          />
          <p className="small" style={{ marginTop: 8 }}>{`40 คือค่าจากตัวอย่างในเอกสาร (20 × 2 ขา) ยิ่ง hedge บ่อยหรือหลายรอบ ยิ่งมาก`}</p>
        </div>
      </div>

      <div className="grid cols-4">
        <Stat label="กำไรดิบ (ก่อนต้นทุน)" value={`${fmt(GROSS, 2)} $`} />
        <Stat label="ต้นทุนรวม" value={`${fmt(cost.totalCost, 2)} $`} />
        <Stat label="คงเหลือ (หลังต้นทุน)" value={`${fmt(cost.net, 2)} $`} />
        <Stat label="ต้นทุนกินกำไร" value={pct(cost.costPct, 1)} />
      </div>

      {cost.net <= 0 ? (
        <Callout tone="danger">
          {`ต้นทุน ${fmt(cost.totalCost, 2)} $ กินกำไรดิบ 200 $ หมด `}
          <strong>Gamma ที่เก็บมาไม่เหลืออะไร</strong>
          {` นี่คือเหตุผลที่เอกสารเตือนเรื่องการ hedge ถี่เกินไป`}
        </Callout>
      ) : cost.costPct >= 50 ? (
        <Callout tone="warn">{`ต้นทุนกินกำไรไป ${pct(cost.costPct, 1)} แล้ว — การ hedge ที่ถี่ขึ้นไม่ได้แปลว่ากำไรขึ้น`}</Callout>
      ) : (
        <Callout tone="ok">{`ยังเหลือ ${fmt(cost.net, 2)} $ หลังหักต้นทุน (กินไป ${pct(cost.costPct, 1)})`}</Callout>
      )}

      <ChartBox height={300}>
        <BarChart data={cost.costRows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <Grid />
          <Ax yLabel="ดอลลาร์" yDomain={[0, cost.yMax]} />
          <Bar dataKey="กำไรดิบ" stackId="cost" fill={C.up} isAnimationActive={false} />
          <Bar dataKey="ต้นทุน" stackId="cost" fill={C.down} isAnimationActive={false} />
          <Tt unit="$" />
        </BarChart>
      </ChartBox>

      <div className="card">
        <p><strong>{`Transaction Costs`}</strong>{` — การ hedge ถี่เกินไปอาจทำให้ spread, commission และ slippage กินกำไรจาก Gamma`}</p>
        <p><strong>{`ตัวเลขในช่องกรอกเป็นค่าที่คุณสมมติเอง`}</strong>{` — เอกสารไม่ได้ให้ต้นทุนต่อหุ้น และกำไรดิบ 200 $ ก็มาจากการประมาณเฉพาะจุดที่ยังไม่รวม Premium และ Theta`}</p>
      </div>

      <h2>3 · Delta เปลี่ยนเมื่อ IV เปลี่ยน</h2>

      <div className="controls">
        <Slider
          label="ราคาสินทรัพย์ (S)"
          value={spot}
          min={1}
          max={300}
          step={1}
          onChange={setSpot}
        />
        <Slider
          label="ราคาใช้สิทธิ (K)"
          value={strike}
          min={1}
          max={300}
          step={1}
          onChange={setStrike}
        />
        <Slider
          label="วันถึงครบกำหนด"
          value={tDays}
          min={1}
          max={365}
          step={1}
          onChange={setTDays}
          format={(v) => `${v} วัน`}
        />
        <Slider
          label="IV พื้นฐาน"
          value={ivBase}
          min={5}
          max={150}
          step={1}
          onChange={setIvBase}
          format={(v) => `${v}%`}
        />
        <Slider
          label="IV เปลี่ยน"
          value={ivShift}
          min={-20}
          max={20}
          step={1}
          onChange={setIvShift}
          format={(v) => `${v >= 0 ? "+" : ""}${v} จุด`}
        />
        <Slider
          label="อัตราดอกเบี้ย r (%)"
          value={rate}
          min={0}
          max={20}
          step={0.5}
          onChange={setRate}
        />
      </div>

      <div className="grid cols-4">
        <Stat label="Delta ที่ IV เดิม" value={signed(bs.deltaA, 4)} />
        <Stat label={`Delta ที่ IV ${ivBase + ivShift}%`} value={signed(bs.deltaB, 4)} />
        <Stat label="ผลต่าง" value={signed(bs.diff, 4)} />
        <Stat label="เทียบเท่าหุ้น" value={`${signed(bs.sharesEquiv, 2)} หุ้น`} />
      </div>

      <Caption>{`คำนวณด้วย Black–Scholes: `}<code>Delta = N(d1)</code>{` — `}<strong>ใช้เพื่อแสดงให้เห็นว่า Delta ไม่ใช่ค่าคงที่</strong>{` ไม่ใช่การรับรองความแม่นยำของโมเดลต่อตลาดจริง`}</Caption>

      <Callout tone="warn">
        {`ราคาสินทรัพย์และปัจจัยอื่น`}
        <strong>ไม่ได้เปลี่ยน</strong>
        {` แต่ IV เปลี่ยน ${signed(ivShift, 0)} จุด ทำให้ Delta เปลี่ยน ${signed(bs.diff, 4)} — `}
        <strong>นี่คือ Shadow Greek ที่เรียกว่า Vanna</strong>
        {` คือ Delta ขยับเพราะ IV ขยับ ไม่ใช่เพราะราคา`}
      </Callout>

      <div className="card">
        <p><strong>{`Shadow Greeks`}</strong>{` — Delta อาจเปลี่ยนเพราะ IV เปลี่ยน (`}<strong>Vanna</strong>{`) และ Vega อาจเปลี่ยนเมื่อ IV เปลี่ยน (`}<strong>Vomma / Volga</strong>{`)`}</p>
        <p><strong>{`ความหมายสำหรับการเรียน`}</strong>{` — Greeks เป็นค่าตามสถานการณ์ ไม่ใช่ค่าคงที่ ตัวเลข Delta ที่คำนวณวันนี้จะเปลี่ยนเองพรุ่งนี้ถึงราคาจะไม่ขยับเลย`}</p>
      </div>

      <h2>จุดที่ต้นฉบับชวนให้ระวัง</h2>
      <div className="grid cols-2">
        <div className="card">
          <h4>{`1 · Gap และ Jump Risk`}</h4>
          <p>{`ราคากระโดดข้ามระดับที่ตั้งใจ hedge ได้ โดยเฉพาะข้ามคืน/วันหยุด/ช่วงข่าว`}</p>
        </div>
        <div className="card">
          <h4>{`2 · Transaction Costs`}</h4>
          <p>{`การ hedge ถี่เกินไปอาจทำให้ spread, commission และ slippage กินกำไรจาก Gamma`}</p>
        </div>
        <div className="card">
          <h4>{`3 · Shadow Greeks`}</h4>
          <p>{`Delta เปลี่ยนเพราะ IV เปลี่ยน (Vanna) และ Vega เปลี่ยนเมื่อ IV เปลี่ยน (Vomma/Volga)`}</p>
        </div>
        <div className="card">
          <h4>{`4 · ความสัมพันธ์ระหว่างสินทรัพย์`}</h4>
          <p>{`Correlation เปลี่ยนตามภาวะตลาด จึงไม่ควรสมมติว่าการ hedge หรือกระจายความเสี่ยงจะทำงานเหมือนเดิมตลอดเวลา`}</p>
        </div>
      </div>

      <h2>หมายเหตุการอ่าน</h2>

      <Callout tone="warn">
        <p style={{ marginTop: 0 }}>{`เอกสารใช้ตัวอย่างทองคำและเหตุการณ์สุดขั้วเพื่อสื่อความเสี่ยง`}</p>
        <p style={{ marginBottom: 0 }}>{`คำกล่าวเฉพาะ เช่น ทองคำกับ IV มีความสัมพันธ์ทิศทางใด หรือ Correlation "วิ่งเข้า 1" ในทุกวิกฤต `}<strong>เป็นการอธิบายของผู้เขียนที่ควรตรวจด้วยข้อมูลหรืองานวิจัยเพิ่มเติม ไม่ควรถือเป็นกฎสากล</strong></p>
      </Callout>

      <Caption>
        {`ต้นฉบับ: `}
        <a href="/pdf/04_Part_4_Beyond_Theory.pdf">เปิด 04_Part_4_Beyond_Theory.pdf</a>
        {` · ต่อยอดจากโน้ต 03 และ 05`}
      </Caption>
    </>
  );
}
