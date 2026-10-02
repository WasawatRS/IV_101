"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="brand">
          CME<span>·</span>101 โน้ตสื่อการเรียน
        </Link>
        <nav className="navlinks">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
