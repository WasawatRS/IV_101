import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const thai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CME·101 — โน้ตสื่อการเรียน",
    template: "%s · CME·101",
  },
  description:
    "สื่อการเรียนเชิงโต้ตอบจากโน้ต CME_101 — Expected Move, Volatility, Greeks, Gamma Hedging และ Volatility Smile",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${thai.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <Nav />
          <main className="wrap">{children}</main>
          <footer className="site">
            สร้างจากโน้ตใน vault <code>obsidian_zone</code> · ทุกตัวเลขในหน้านี้เป็น
            ภาพจำลองเพื่อการเรียน ไม่ใช่ข้อมูลตลาดจริง
          </footer>
        </div>
      </body>
    </html>
  );
}
