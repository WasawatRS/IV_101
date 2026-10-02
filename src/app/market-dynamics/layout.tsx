import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gamma, Flow และราคา",
  description: "Long/Short GEX, วิธี hedge สามแบบ และ Pinning",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
