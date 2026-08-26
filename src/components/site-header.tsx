"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TroopMark } from "@/components/troop-mark";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/attendance", label: "Attendance" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-0">
          <TroopMark className="text-primary h-4 w-6" />
          <span className="font-heading text-base font-semibold tracking-tight">
            Troop
          </span>
        </Link>

        <nav className="flex items-center justify-center gap-6">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div />
      </div>
    </header>
  );
}
