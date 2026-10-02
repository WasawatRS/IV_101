export type PathKey = "A" | "B" | "C" | "D" | "E";

export type PathInfo = {
  key: PathKey;
  label: string;
  desc: string;
};

export type Note = {
  no: number;
  path: PathKey;
  note: string;
  pdf: string;
  title: string;
  summary: string;
  caveat: string;
};

export type Term = {
  term: string;
  def: string;
  ref: string;
};

export type IndexNote = {
  no: number;
  note: string;
  title: string;
  path: PathKey | null;
  pdf: string | null;
};

export const PATHS: PathInfo[] = [
  { key: "A", label: "A · เปลี่ยนมุมมองและอ่านความผันผวน", desc: "เปลี่ยนมุมมองและอ่านความผันผวน" },
  { key: "B", label: "B · เข้าใจ Options และความเสี่ยง", desc: "เข้าใจ Options และความเสี่ยง" },
  { key: "C", label: "C · ศึกษา 0DTE", desc: "ศึกษา 0DTE จากบทความวิจัยและกฎการเทรด" },
  { key: "D", label: "D · คำนวณกรอบราคาและแผนปฏิบัติ", desc: "คำนวณกรอบราคาและทำแผนปฏิบัติ" },
  { key: "E", label: "E · กรณีศึกษา Gold", desc: "กรณีศึกษา Gold" },
];

export const NOTES: Note[] = [
  {
    no: 1,
    path: "A",
    note: "01_เปลี่ยนกระบวนทัศน์",
    pdf: "01_Part_1_Paradigm_Shift.pdf",
    title: "เปลี่ยนกระบวนทัศน์",
    summary: "จากการเดาทิศทาง ไปสู่การวัดความเสี่ยงที่ตลาดตั้งราคา",
    caveat: "",
  },
  {
    no: 2,
    path: "A",
    note: "02_เลนส์ความผันผวน",
    pdf: "02_The_Volatility_Lens.pdf",
    title: "เลนส์ความผันผวน",
    summary: "สไลด์ IV/RV, Bollinger, Z-score และ Volume Profile",
    caveat: "แกนเวลาหน้า 6 และป้ายราคาหน้า 7 ใช้ไม่ได้",
  },
  {
    no: 3,
    path: "B",
    note: "03_Greeks_และ_Gamma_Scalping",
    pdf: "03_Part_2_The_Greeks.pdf",
    title: "Greeks และ Gamma Scalping",
    summary: "Delta, Gamma, Theta และการปรับ hedge",
    caveat: "",
  },
  {
    no: 4,
    path: "B",
    note: "04_Part_4_Beyond_Theory",
    pdf: "04_Part_4_Beyond_Theory.pdf",
    title: "Beyond Theory",
    summary: "ข้อจำกัดของ Black–Scholes เมื่อเจอ gap, fat tails และตลาดจริง",
    caveat: "",
  },
  {
    no: 5,
    path: "B",
    note: "05_Part_3_Market_Dynamics",
    pdf: "05_Part_3_Market_Dynamics.pdf",
    title: "Market Dynamics",
    summary: "แรง hedge ของผู้ดูแลสภาพคล่องและข้อจำกัดของ GEX",
    caveat: "",
  },
  {
    no: 6,
    path: "B",
    note: "06_Deep_Dive_0DTE_Gamma_Hedging",
    pdf: "06_Deep_Dive_0DTE_Gamma_Hedging.pdf",
    title: "Deep Dive 0DTE Gamma Hedging",
    summary: "การกลับตัวที่ขอบเขต SD/VOL2VOL",
    caveat: "ชื่อใน PDF เป็นรายงาน SD/VOL2VOL ไม่ตรงชื่อไฟล์",
  },
  {
    no: 7,
    path: "B",
    note: "07_Gamma_Hedging_Sensitivity",
    pdf: "07_Gamma_Hedging_Sensitivity.pdf",
    title: "Gamma Hedging Sensitivity",
    summary: "gamma hedging อาจเพิ่มหรือลดแรงเคลื่อนไหว",
    caveat: "ปริมาณซื้อขายอย่างเดียวไม่เท่ากับความเสี่ยงสุทธิ",
  },
  {
    no: 8,
    path: "C",
    note: "08_Retail_Traders_Love_0DTE",
    pdf: "08_Retail_Traders_Love_0DTE.pdf",
    title: "Retail Traders Love 0DTE",
    summary: "งานวิจัยเรื่องพฤติกรรมผู้ลงทุนรายย่อยใน 0DTE",
    caveat: "งานวิจัย อ่านโดยแยกคำถาม วิธีศึกษา และช่วงข้อมูล",
  },
  {
    no: 9,
    path: "C",
    note: "09_The_Market_for_0DTE_Liquidity",
    pdf: "09_The_Market_for_0DTE_Liquidity.pdf",
    title: "The Market for 0DTE Liquidity",
    summary: "ตลาดและสภาพคล่องของ 0DTE",
    caveat: "งานวิจัย อย่านำผลช่วงเวลาหนึ่งไปเหมารวม",
  },
  {
    no: 10,
    path: "C",
    note: "10_Does_0DTE_Increase_Volatility",
    pdf: "10_Does_0DTE_Increase_Volatility.pdf",
    title: "Does 0DTE Increase Volatility",
    summary: "คำถามว่า 0DTE เพิ่มความผันผวนของตลาดหรือไม่",
    caveat: "งานวิจัย อ่านร่วมกับ 11 และ 12",
  },
  {
    no: 11,
    path: "C",
    note: "11_0DTE_Impact_on_Market_Volatility",
    pdf: "11_0DTE_Impact_on_Market_Volatility.pdf",
    title: "0DTE Impact on Market Volatility",
    summary: "ผลกระทบของ 0DTE ต่อความผันผวน",
    caveat: "งานวิจัย อย่านำผลช่วงเวลาหนึ่งไปเหมารวม",
  },
  {
    no: 12,
    path: "C",
    note: "12_0DTE_Gamma_Risk_Volatility_Propagation",
    pdf: "12_0DTE_Gamma_Risk_Volatility_Propagation.pdf",
    title: "0DTE Gamma Risk และ Volatility Propagation",
    summary: "การแพร่กระจายของความเสี่ยง gamma ใน 0DTE",
    caveat: "งานวิจัย อ่านโดยแยกคำถามและกลุ่มข้อมูล",
  },
  {
    no: 13,
    path: "B",
    note: "13_Intraday_Jumps_and_0DTE",
    pdf: "13_Intraday_Jumps_and_0DTE.pdf",
    title: "Intraday Jumps และ 0DTE",
    summary: "jump risk, volatility smile และ hedge error",
    caveat: "",
  },
  {
    no: 14,
    path: "A",
    note: "14_Volatility_Lens_Measurement",
    pdf: "14_Volatility_Lens_Measurement.pdf",
    title: "Volatility Lens Measurement",
    summary: "IV, OI, Gamma ของผู้ดูแลสภาพคล่อง และ 4 มิติ: ATM, skew, wings, term structure",
    caveat: "สไลด์อินโฟกราฟิก ตัวเลขบนกราฟหน้า 2 ใช้คำนวณไม่ได้",
  },
  {
    no: 15,
    path: "D",
    note: "15_Standard_Deviation_และ_กรอบราคา",
    pdf: "15_สูตรคำนวนSD.pdf",
    title: "Standard Deviation และกรอบราคา",
    summary: "ระยะคาดหมาย, SD และแนวทางกรอบราคาที่เอกสารเสนอ",
    caveat: "หน้าแรกของบทเรียนในแอปนี้มาจากไฟล์นี้",
  },
  {
    no: 16,
    path: "D",
    note: "16_เครืองมือVol2Vol",
    pdf: "16_เครืองมือVol2Vol.pdf",
    title: "เครื่องมือ Vol2Vol",
    summary: "อ่านหน้าจอ QuikStrike: OI, Vol, แถบ Delta และเส้น Vol Settle",
    caveat: "หน้า 4 ว่าง",
  },
  {
    no: 17,
    path: "D",
    note: "17_Options_Data_for_Futures_Edge",
    pdf: "17_Options_Data_for_Futures_Edge.pdf",
    title: "Options Data สำหรับ Futures",
    summary: "สไลด์ IV/OI สำหรับเทรด Futures",
    caveat: "กฎ 16 และ PCR เป็นทางลัดที่ต้องตรวจ ไม่ใช่ผลทดสอบ",
  },
  {
    no: 18,
    path: "C",
    note: "18_0DTE_Trading_Rules",
    pdf: "18_0DTE_Trading_Rules.pdf",
    title: "0DTE Trading Rules",
    summary: "payoff จริงของโครงสร้าง SPXW 0DTE และกฎจับเวลาแบบ out-of-sample",
    caveat: "",
  },
  {
    no: 19,
    path: "A",
    note: "19_Quantitative_Volatility_Playbook",
    pdf: "19_Quantitative_Volatility_Playbook.pdf",
    title: "Quantitative Volatility Playbook",
    summary: "IV/RV, Z-score, Bollinger และ Volume Profile; เมทริกซ์เป็นกรอบสอน",
    caveat: "สูตรขนาดสถานะยังประกอบไม่ได้ เพราะไม่นิยาม R",
  },
  {
    no: 20,
    path: "D",
    note: "20_Part_5_Practical_Strategies",
    pdf: "20_Part_5_Practical_Strategies.pdf",
    title: "Practical Strategies",
    summary: "playbook ทองคำ: short vega ด้วย iron condor, long gamma และขนาดตาม IV",
    caveat: "ตัวอย่างทองคำของผู้เขียน ไม่ใช่ผลทดสอบ",
  },
  {
    no: 21,
    path: "E",
    note: "21_Gold_Option_Analysis_Mtraders",
    pdf: "21_Gold_Option_Analysis_Mtraders.pdf",
    title: "Gold Option Analysis (Mtraders)",
    summary: "กรณีเล่า hedge ของ short put ทองคำ",
    caveat: "ใช้กลไกได้ แต่ห้ามใช้ตัวเลข P&L และจำนวนสัญญา",
  },
  {
    no: 22,
    path: "E",
    note: "22_Gold_Gamma_Quant_Analysis",
    pdf: "22_Gold_Gamma_Quant_Analysis.pdf",
    title: "Gold Gamma Quant Analysis",
    summary: "สไลด์ OI ของ G4WG6 ที่ 0.68 วัน",
    caveat: "ระดับ 5000–5320 เป็นแผนที่ของสไลด์ ไม่ใช่ผลทดสอบ",
  },
  {
    no: 23,
    path: "E",
    note: "23_Gold_Gamma_Squeeze_Briefing",
    pdf: "23_Gold_Gamma_Squeeze_Briefing.pdf",
    title: "Gold Gamma Squeeze Briefing",
    summary: "บรีฟ squeeze ของสแนปช็อต G4WG6",
    caveat: "spot ~5202 และแผน 5100/5250 เป็นของสไลด์",
  },
];

export const TERMS: Term[] = [
  {
    term: "Implied Volatility (IV)",
    def: "ความผันผวนที่ตลาดยอมจ่ายผ่านราคา option เป็นตัวเลขรายปี ตลาดตั้งไว้ล่วงหน้า",
    ref: "โน้ต 15, 19",
  },
  {
    term: "Realized Volatility (RV)",
    def: "ความผันผวนที่เกิดขึ้นจริงในอดีต วัดได้จากข้อมูลราคา",
    ref: "โน้ต 15, 19",
  },
  {
    term: "Expected Move (EM)",
    def: "ช่วงราคาที่ตลาดคาดหวัง คำนวณจาก ราคา × IV × √(DTE/365)",
    ref: "โน้ต 15",
  },
  {
    term: "Standard Deviation (SD)",
    def: "ค่ากระจายรอบค่าเฉลี่ย ±1 SD ครอบคลุมราว 68% ภายใต้การแจกแจงปกติ",
    ref: "โน้ต 15",
  },
  {
    term: "Greeks",
    def: "ตัวชี้วัดความอ่อนไหวของราคา option ต่อปัจจัยต่าง Delta, Gamma, Theta, Vega",
    ref: "โน้ต 03",
  },
  {
    term: "Gamma",
    def: "อัตราการเปลี่ยนของ Delta บอกว่า hedge ต้องปรับบ่อยแค่ไหน",
    ref: "โน้ต 03, 07",
  },
  {
    term: "0DTE",
    def: "option ที่หมดอายุในวันเดียวกับที่ซื้อ ความเสี่ยง gamma กระจุกตัวในหนึ่งวัน",
    ref: "โน้ต 08–12, 18",
  },
  {
    term: "Fat Tails",
    def: "ตลาดเคลื่อนที่ไกลกว่าที่ปกติบอกไว้ ±3 SD ถูกเจอบ่อยครั้ง",
    ref: "โน้ต 04, 17",
  },
  {
    term: "Volatility Smile / Skew",
    def: "IV ต่างกันตาม strike ทำให้รูปทรงจริงไม่ใช่ระฆังสมมาตร",
    ref: "โน้ต 16",
  },
];

export const INDEX_NOTES: IndexNote[] = [
  { no: 0, note: "00_เริ่มที่นี่", title: "เริ่มที่นี่", path: null, pdf: null },
  { no: 0, note: "00_แผนที่ความรู้", title: "แผนที่ความรู้", path: null, pdf: null },
  { no: 0, note: "00_ทะเบียนแหล่งข้อมูล", title: "ทะเบียนแหล่งข้อมูล", path: null, pdf: null },
];

export const RESEARCH_CAVEAT =
  "ควรอ่านงานวิจัยโดยแยกคำถาม วิธีศึกษา กลุ่มข้อมูล และข้อจำกัด อย่านำผลจากตลาด/ช่วงเวลาหนึ่งไปเหมารวมกับทุกตลาด";

export const pdfHref = (pdf: string) => `/pdf/${pdf}`;
