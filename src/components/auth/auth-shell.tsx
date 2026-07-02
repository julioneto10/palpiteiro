import Link from "next/link";
import { cn } from "@/lib/utils";

const TAPE_ITEMS = [
  "★ COPA DO MUNDO 2026 ★",
  "O MAIOR BOLAO ENTRE AMIGOS",
  "★ PALPITEIRO ★",
  "BRA · ARG · FRA · ESP · ENG",
];

export function AuthShell({
  active,
  next,
  children,
}: {
  active: "login" | "signup";
  next?: string;
  children: React.ReactNode;
}) {
  const qs = next ? `?redirect=${encodeURIComponent(next)}` : "";
  const pill = (isActive: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider transition-colors",
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-foreground/50 hover:text-foreground/80"
    );

  return (
    <div className="relative min-h-dvh w-full overflow-hidden text-foreground">
      {/* Faixa rolando no topo */}
      <div className="tape absolute inset-x-0 top-0">
        <div className="marquee">
          {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 pb-12 pt-20">
        {/* Wordmark gigante empilhado */}
        <div>
          <h1 className="font-heading text-[76px] font-black uppercase leading-[0.82] tracking-tight">
            PAL
            <br />
            PI
            <br />
            TEI<span className="text-accent">RO</span>
          </h1>
          <p className="mt-3 max-w-[280px] text-sm leading-snug text-foreground/60">
            Palpite os jogos da Copa, dispute com seus amigos e suba no ranking.
          </p>
        </div>

        {/* Toggle Entrar / Criar conta */}
        <div className="flex self-start gap-1 rounded-full bg-foreground/[0.06] p-1">
          <Link href={`/login${qs}`} className={pill(active === "login")}>
            Entrar
          </Link>
          <Link href={`/cadastro${qs}`} className={pill(active === "signup")}>
            Criar conta
          </Link>
        </div>

        {children}

        <p className="mt-auto pt-6 text-center text-[11px] text-foreground/40">
          Ao continuar, voce aceita os termos e a politica de privacidade.
        </p>
      </div>
    </div>
  );
}

/** Estilos compartilhados dos formularios escuros de auth. */
export const authInputClass =
  "w-full rounded-xl border border-[#2A332E] bg-[#1B231D] px-4 py-3.5 text-[15px] text-background outline-none transition-colors placeholder:text-foreground/40 focus:border-accent/60";

export const authPrimaryBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-[15px] font-extrabold text-accent-foreground transition active:scale-[0.99] disabled:opacity-60";

export const authGhostBtnClass =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-transparent px-4 py-3 text-sm font-bold text-foreground transition hover:bg-foreground/[0.04] active:scale-[0.99] disabled:opacity-60";
