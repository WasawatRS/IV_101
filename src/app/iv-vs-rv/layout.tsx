import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "IV เทียบ RV",
  description: "Bollinger band, Volatility Risk Premium, Z-score และ Volume profile",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
