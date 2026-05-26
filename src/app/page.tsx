import Link from "next/link";
import { Trophy, Users, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

const TAPE_ITEMS = [
  "★ COPA DO MUNDO 2026 ★",
  "O MAIOR BOLAO ENTRE AMIGOS",
  "★ PALPITEIRO ★",
  "BRA · ARG · FRA · ESP · ENG",
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Palpites",
    description:
      "Preveja o placar e o artilheiro de cada jogo da Copa do Mundo 2026.",
  },
  {
    icon: Users,
    title: "Boloes",
    description: "Crie um bolao e chame os amigos, a familia e a galera do trampo.",
  },
  {
    icon: Trophy,
    title: "Ranking",
    description: "Acompanhe quem manda no ranking e palpite no campeao da Copa.",
  },
  {
    icon: ShieldCheck,
    title: "Jogo limpo",
    description:
      "Palpites travam no apito e os resultados ficam auditados. Sem trapaca.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Hero escuro */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="tape absolute inset-x-0 top-0">
          <div className="marquee">
            {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-md flex-col gap-6 px-6 pb-12 pt-20">
          <h1 className="font-heading text-[76px] font-black uppercase leading-[0.82] tracking-tight">
            PAL
            <br />
            PI
            <br />
            TEI<span className="text-accent">RO</span>
          </h1>
          <p className="max-w-[300px] text-base leading-snug text-background/70">
            O bolao mais divertido da Copa do Mundo 2026. Palpite os jogos,
            dispute com os amigos e suba no ranking.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/cadastro"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-[15px] font-extrabold text-accent-foreground transition active:scale-[0.99]"
            >
              Comecar agora <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-background transition hover:bg-white/[0.04]"
            >
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features (creme) */}
      <section className="mx-auto w-full max-w-lg px-5 py-12">
        <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Como funciona
        </h2>
        <div className="grid gap-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Palpiteiro &copy; 2026 · Feito com ⚽ no Brasil
      </footer>
    </div>
  );
}
