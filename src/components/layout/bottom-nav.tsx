"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CircleDot,
  Sparkles,
  Users,
  Swords,
  Trophy,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/jogos", label: "Jogos", icon: CircleDot },
  { href: "/palpites", label: "Palpites", icon: Sparkles },
  { href: "/boloes", label: "Boloes", icon: Users },
  { href: "/disputas", label: "Disputas", icon: Swords },
  { href: "/ranking", label: "Ranking", icon: Trophy },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "fill-primary/20"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
