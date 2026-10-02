import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Expected Move",
  description: "ห้องทดลอง Expected Move — ปรับ IV และ DTE แล้วดูช่วง ±1 SD",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
