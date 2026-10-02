import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Greeks",
  description: "Delta, Gamma, Theta และตัวอย่าง hedge stepper",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
