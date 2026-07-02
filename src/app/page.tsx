import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getUserId } from "@/lib/supabase/user";

const TAPE_ITEMS = [
  "★ COPA DO MUNDO 2026 ★",
  "O MAIOR BOLAO ENTRE AMIGOS",
  "★ PALPITEIRO ★",
  "BRA · ARG · FRA · ESP · ENG",
];

const FEATURES = [
  {
    number: "01",
    title: "Palpita",
    description:
      "Preveja o placar de cada jogo da Copa do Mundo 2026 antes da bola rolar.",
  },
  {
    number: "02",
    title: "Chama a galera",
    description:
      "Crie um bolao e chame os amigos, a familia e a galera do trampo.",
  },
  {
    number: "03",
    title: "Sobe no ranking",
    description:
      "Cravou o placar, pontuou. Acompanhe quem manda no ranking em tempo real.",
  },
  {
    number: "04",
    title: "Jogo limpo",
    description:
      "Palpites travam antes do apito e os resultados ficam auditados. Sem trapaca.",
  },
];

export default async function LandingPage() {
  // Quem ja esta logado abre direto no ranking do bolao.
  const userId = await getUserId();
  if (userId) redirect("/inicio");

  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <section className="relative overflow-hidden">
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
          <p className="max-w-[300px] text-base leading-snug text-foreground/70">
            O bolao mais divertido da Copa do Mundo 2026. Palpite os jogos,
            dispute com os amigos e suba no ranking.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/cadastro"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-[15px] font-extrabold text-accent-foreground shadow-[0_10px_30px_-8px_rgba(255,212,0,0.45)] transition active:scale-[0.99]"
            >
              Comecar agora <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-input px-4 py-3 text-sm font-bold text-foreground transition hover:bg-foreground/[0.04]"
            >
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto w-full max-w-lg px-6 py-12">
        <h2 className="mb-8 text-center font-heading text-[13px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Como funciona
        </h2>
        <div className="space-y-7">
          {FEATURES.map(({ number, title, description }) => (
            <div key={number} className="flex items-start gap-5">
              <span className="font-heading text-[26px] font-black leading-none text-success">
                {number}
              </span>
              <div className="pt-0.5">
                <h3 className="font-heading text-base font-extrabold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        Palpiteiro &copy; 2026 · Feito no Brasil
      </footer>
    </div>
  );
}
