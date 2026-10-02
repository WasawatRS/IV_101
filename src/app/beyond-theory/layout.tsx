import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "เมื่อโมเดลเจอตลาดจริง",
  description: "Gap risk, Gamma Scalping หลังต้นทุน และ Vanna",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
