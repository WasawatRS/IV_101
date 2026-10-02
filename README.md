# CME·101 — โน้ตสื่อการเรียน

เว็บสื่อการเรียนเชิงโต้ตอบ สร้างจากโน้ต 23 ฉบับที่ถอดจาก PDF ต้นฉบับในโฟลเดอร์ `101/`

**ไม่ใช่เว็บเทรด** — ไม่มีข้อมูลราคาเรียลไทม์ ไม่มีสัญญาณเข้า/ออก และทุกตัวเลขในหน้าเว็บเป็นภาพจำลองเพื่อการเรียน

## หน้าเว็บ

| เส้นทาง | เนื้อหา | โน้ตต้นทาง |
|---|---|---|
| `/` | เส้นทางเรียน 4 ขั้น และสิ่งที่เว็บนี้ไม่ทำ | 00 |
| `/expected-move/` | สูตร Expected Move, ±1/2/3 SD, กรอบราคา | 15 |
| `/iv-vs-rv/` | Bollinger, Volatility Risk Premium, Z-score, Volume profile | 02 |
| `/greeks/` | Delta, Gamma, Theta, hedge stepper | 03 |
| `/beyond-theory/` | Gap risk, Gamma Scalping หลังต้นทุน, Vanna | 04 |
| `/market-dynamics/` | Long/Short GEX, วิธี hedge 3 แบบ, Pinning | 05 |
| `/vol-smile/` | Volatility smile, put skew, แถบ Delta Ranges | 16 |
| `/glossary/` | ค้นศัพท์ + โน้ตทั้ง 23 ฉบับ + เปิด PDF | 23 |

## รันในเครื่อง

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # static export ไปที่ out/
```

ตั้งค่า `output: "export"` ใน `next.config.ts` — ได้เว็บ static ล้วน ไม่ต้องมี Node server

## ขึ้น Vercel

1. Push ขึ้น GitHub (ดูหัวข้อถัดไป)
2. เข้า [vercel.com/new](https://vercel.com/new) → Import repo → ตรวจว่า Framework = Next.js
3. Deploy — เสร็จแล้วได้ URL ให้ใช้ทันที

ทุกครั้งที่ `git push` Vercel จะ build ให้อัตโนมัติ

### สร้าง repo และ push

```bash
git init
git add .
git commit -m "CME·101 study site (Next.js static export)"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/<ชื่อ repo>.git
git push -u origin main
```

> **เรื่องขนาด:** `public/pdf/` มี PDF ต้นฉบับ 23 ไฟล์ รวม 95.2 MB (ไฟล์ใหญ่สุด 15.9 MB)
> อยู่ใต้เพดาน 100 MB ต่อไฟล์ของ GitHub และเพดาน 1 GB ของ Vercel Pro
> ถ้าอยากลดขนาด repo ให้ย้าย PDF ไป Vercel Blob หรือ GitHub Releases แล้วเปลี่ยนลิงก์ใน `src/lib/notes.ts`

## โครงสร้าง

```
next.config.ts        output: "export" + trailingSlash
src/app/              App Router — 1 โฟลเดอร์ต่อ 1 หน้า (page.tsx + layout.tsx)
src/components/       Nav, ui (Callout/Stat/DataTable/Slider/…), chartkit (Recharts)
src/lib/math.ts       สูตรทั้งหมด (EM, Black–Scholes, normal/Laplace, RNG แบบ seed)
src/lib/notes.ts      ข้อมูลโน้ต 23 ฉบับสำหรับหน้า glossary
public/pdf/           PDF ต้นฉบับ 23 ไฟล์
```

## เครื่องมือ Streamlit (ของเดิม ใช้ในเครื่องเท่านั้น)

`streamlit_app.py` + `app_pages/` + `obsidian_zone/` ยังอยู่และยังรันได้ แต่ถูก gitignore
ไว้ ไม่ถูก push ขึ้น Vercel

```bash
streamlit run streamlit_app.py
```

## ข้อควรรู้

- **ตัวเลขทุกตัวเป็นภาพจำลอง** — ไม่มีการดึงราคาตลาดจริง และทุกหน้ามีป้ายกำกับไว้ชัดเจน
- **คำเตือนจากโน้ตถูกคงไว้ครบ** — จุดที่เอกสารตัวเองบอกว่ายังไม่ได้พิสูจน์ ถูกเขียนไว้ในหน้านั้นด้วย
- **Prefetch 404:** บน static host พื้นฐาน (เช่น `python -m http.server`) จะเห็น 404 ที่
  `__next.<route>.__PAGE__.txt` — เป็น RSC payload ที่ Next ยังไม่ emit ตาม path ที่ prefetch
  **ไม่กระทบการใช้งาน** (Navigation fallback เป็น full page load เอง) และไม่เกิดบน Vercel
