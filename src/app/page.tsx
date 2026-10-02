import Link from "next/link";
import { Callout } from "@/components/ui";

const STEPS: { title: string; body: string }[] = [
  {
    title: "1 · ทำไมต้องเปลี่ยนกระบวนทัศน์",
    body: "เดิมมองความเสี่ยงเป็นตัวแปรที่ต้องกำจัด แต่ความผันผวนคือสิ่งที่ต้องวัดและบริหาร อ่านโน้ต 01 และ 02",
  },
  {
    title: "2 · รู้จักตัวชี้วัดสองตัว",
    body: "Realized Volatility คือสิ่งที่เกิดขึ้นแล้ว Implied Volatility คือราคาที่ตลาดตั้งไว้ล่วงหน้า RV ใช้ได้กับอดีต ส่วน IV เป็นความคาดหวัง ไม่ใช่การทำนาย อ่านโน้ต 15 และ 19",
  },
  {
    title: "3 · แปลงความผันผวนเป็นช่วงราคา",
    body: "Expected Move แปลง IV เป็นช่วงราคาที่ตลาดคาดหวัง ลองปรับค่าดูว่า IV กับเวลาส่งผลอย่างไร",
  },
  {
    title: "4 · อ่านข้อจำกัด",
    body: "โมเดลสมมติการกระจายตัวเป็นปกติ แต่ตลาดมีหางหนาและมี event อ่านโน้ต 16 เรื่อง Volatility Smile และโน้ต 17 เรื่อง Fat Tails",
  },
];

export default function HomePage() {
  return (
    <>
      <p className="eyebrow">CME · 101</p>
      <h1>เข้าใจความเสี่ยงก่อนพูดถึงกำไร</h1>
      <p className="lede">
        นี่คือ<strong>สื่อการเรียน</strong> สร้างจากโน้ต 23 ฉบับที่ถอดจาก PDF
        หน้าที่ของเว็บนี้คือทำให้แนวคิดจับต้องได้ ไม่ได้มีไว้บอกว่าจะเทรดอะไร
      </p>

      <Callout tone="warn" title="อ่านก่อนใช้ตัวเลข">
        เอกสารต้นทางเป็นทั้งสไลด์บรรยายและงานวิจัย บางตัวเลขขัดกันเอง
        จุดที่ขัดกันจะถูกทำเครื่องหมายไว้ในโน้ตเสมอ{" "}
        <strong>ห้ามเอาตัวเลขจากสไลด์ไปเป็นค่าตลาด</strong>
      </Callout>

      <h2>เส้นทางเรียน 4 ขั้น</h2>
      <div className="grid cols-2">
        {STEPS.map((s) => (
          <div className="card" key={s.title}>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
          </div>
        ))}
      </div>

      <h2>สามสิ่งที่เว็บนี้ไม่ทำ</h2>
      <ul className="plain">
        <li>ไม่ออกสัญญาณเข้าหรือออกจากสถานะ</li>
        <li>ไม่ใช้ตัวเลข Kill Zone, PCR หรือจุดกลับตัวจากสไลด์เป็นค่าจริง</li>
        <li>
          ไม่รับข้อมูลราคาตลาดเรียลไทม์ ทุกตัวเลขในเว็บมาจากค่าที่คุณกรอกเองเพื่อการเรียน
        </li>
      </ul>

      <h2>ไปต่อ</h2>
      <div className="linkrow">
        <Link className="btn" href="/expected-move/">
          ห้องทดลอง Expected Move · ปรับ IV แล้วดูช่วง ±1 SD
        </Link>
        <Link className="btn ghost" href="/glossary/">
          ศัพท์และแผนที่โน้ต 23 ฉบับ
        </Link>
      </div>

      <p className="small">
        ไฟล์โน้ตทั้งหมดอยู่ในโฟลเดอร์ <code>obsidian_zone/</code> เปิดด้วย Obsidian ได้ทันที
      </p>
    </>
  );
}
