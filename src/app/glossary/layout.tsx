import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ศัพท์และโน้ต",
  description: "ค้นศัพท์และเปิดโน้ตทั้ง 23 ฉบับ พร้อมลิงก์ PDF",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
