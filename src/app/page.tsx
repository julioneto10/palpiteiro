import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Swords, Share2, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Palpites",
    description:
      "Preveja o placar exato e o artilheiro de cada jogo da Copa do Mundo 2026.",
  },
  {
    icon: Users,
    title: "Boloes",
    description:
      "Crie boloes com seus amigos, familia ou colegas de trabalho.",
  },
  {
    icon: Swords,
    title: "Disputas 1v1",
    description:
      "Desafie seus amigos para duelos diretos e prove quem entende mais de futebol.",
  },
  {
    icon: Trophy,
    title: "Ranking",
    description:
      "Acompanhe sua posicao no ranking global e nos seus boloes.",
  },
  {
    icon: Share2,
    title: "Compartilhe",
    description:
      "Compartilhe seus palpites e provoce seus amigos no WhatsApp e Instagram.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-primary/15 via-primary/5 to-background">
        <div className="space-y-6 max-w-md">
          <div className="space-y-2">
            <p className="text-5xl">⚽</p>
            <h1 className="font-heading text-5xl font-extrabold tracking-tight text-primary">
              PALPITEIRO
            </h1>
            <p className="text-lg text-muted-foreground">
              O bolao mais divertido da Copa do Mundo 2026
            </p>
          </div>

          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Faca seus palpites, crie boloes com amigos, dispute 1v1 e veja
            quem eh o maior palpiteiro do Brasil!
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/cadastro">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base px-8 h-12 bg-primary hover:bg-primary/90"
              >
                Comecar agora
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 h-12"
              >
                Ja tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 max-w-lg mx-auto w-full">
        <h2 className="font-heading text-xl font-extrabold text-center mb-8">
          Como funciona
        </h2>
        <div className="grid gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border"
            >
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 px-4 border-t text-xs text-muted-foreground">
        <p>Palpiteiro &copy; 2026. Feito com ⚽ no Brasil.</p>
      </footer>
    </div>
  );
}
