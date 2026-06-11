"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/** Re-roda o server component (puxa ranking novo) a cada `intervalMs`. */
export function LiveRefresh({
  intervalMs = 300_000,
  tone = "light",
}: {
  intervalMs?: number;
  /** "dark" para fundo escuro (TV); "light" usa os tokens do tema do app. */
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const refresh = () => startTransition(() => router.refresh());

  // Marca a hora a cada render do servidor (montagem apos refresh).
  useEffect(() => {
    setUpdatedAt(
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return (
    <button
      onClick={refresh}
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors " +
        (tone === "dark"
          ? "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted")
      }
      title="Atualizar agora"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {updatedAt ? `Atualizado ${updatedAt}` : "Atualizar"}
    </button>
  );
}
