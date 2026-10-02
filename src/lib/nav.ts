export type NavItem = {
  href: string;
  label: string;
  note: string;
  chapter?: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "หน้าแรก", note: "ภาพรวมและเส้นทางเรียน" },
  {
    href: "/expected-move/",
    label: "Expected Move",
    note: "สูตร EM · 1 SD · กรอบราคาจำลอง",
    chapter: "บทที่ 1",
  },
  {
    href: "/iv-vs-rv/",
    label: "IV vs RV",
    note: "Bollinger · VRP · Z-score · Volume profile",
    chapter: "บทที่ 2",
  },
  {
    href: "/greeks/",
    label: "Greeks",
    note: "Delta · Gamma · Theta · Hedge stepper",
    chapter: "บทที่ 3",
  },
  {
    href: "/beyond-theory/",
    label: "Beyond Theory",
    note: "Gap risk · Gamma Scalping · Vanna",
    chapter: "บทที่ 4",
  },
  {
    href: "/market-dynamics/",
    label: "Gamma, Flow และราคา",
    note: "Long/Short GEX · เรื่อง hedge 3 แบบ",
    chapter: "บทที่ 5",
  },
  {
    href: "/vol-smile/",
    label: "Volatility Smile",
    note: "Smile · put skew · แถบ Delta Ranges",
    chapter: "บทที่ 6",
  },
  { href: "/glossary/", label: "ศัพท์และโน้ต", note: "ค้นศัพท์ · เปิดโน้ตทั้ง 23 ฉบับ" },
];
