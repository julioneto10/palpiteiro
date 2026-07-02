"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CircleDot, Crosshair, Users, Trophy } from "lucide-react";

const NAV_ITEMS = [
  { href: "/jogos", label: "Jogos", icon: CircleDot },
  { href: "/palpites", label: "Palpites", icon: Crosshair },
  { href: "/boloes", label: "Boloes", icon: Users },
  { href: "/ranking", label: "Ranking", icon: Trophy },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 pt-1.5 pb-2.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors active:scale-95",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "grid h-[30px] w-[38px] place-items-center rounded-full transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_rgba(23,178,101,0.6)]"
                    : "bg-transparent text-foreground/70"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
