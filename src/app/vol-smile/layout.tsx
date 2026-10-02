import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Volatility Smile",
  description: "Smile, put skew และแถบ Delta Ranges",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
