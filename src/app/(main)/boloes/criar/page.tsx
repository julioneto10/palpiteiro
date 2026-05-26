"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createGroup } from "@/lib/actions/groups";
import { DEFAULT_SCORING } from "@/lib/constants/scoring";
import { ArrowLeft, Lock, Globe, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CriarBolaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"private" | "open">("private");
  const [showScoring, setShowScoring] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.set("type", type);
    const result = await createGroup(formData);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
    }
    // On success, createGroup redirects automatically
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/boloes">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-heading text-xl font-extrabold">Criar Bolao</h1>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Nome do bolao *
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Bolao da firma"
            required
            minLength={3}
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Descricao
          </label>
          <Input
            id="description"
            name="description"
            placeholder="Uma descricao curta (opcional)"
            maxLength={200}
          />
        </div>

        {/* Type selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo do bolao</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("private")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                type === "private"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Privado</p>
                <p className="text-[10px] text-muted-foreground">
                  So entra com convite
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType("open")}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                type === "open"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Aberto</p>
                <p className="text-[10px] text-muted-foreground">
                  Qualquer um pode entrar
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Max members */}
        <div className="space-y-1.5">
          <label htmlFor="maxMembers" className="text-sm font-medium">
            Maximo de membros
          </label>
          <Input
            id="maxMembers"
            name="maxMembers"
            type="number"
            min={2}
            max={1000}
            defaultValue={100}
          />
        </div>

        {/* Stake */}
        <div className="space-y-1.5">
          <label htmlFor="stakeAmount" className="text-sm font-medium">
            Valor da aposta (R$)
          </label>
          <Input
            id="stakeAmount"
            name="stakeAmount"
            type="number"
            min={0}
            step={0.01}
            placeholder="Opcional - apenas informativo"
          />
          <p className="text-[10px] text-muted-foreground">
            Apenas para referencia. O app nao processa pagamentos.
          </p>
        </div>

        {/* Scoring config */}
        <Card>
          <CardHeader className="p-3">
            <button
              type="button"
              onClick={() => setShowScoring(!showScoring)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-sm">
                Pontuacao
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Opcional
                </Badge>
              </CardTitle>
              {showScoring ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showScoring && (
            <CardContent className="p-3 pt-0 space-y-3">
              <p className="text-[10px] text-muted-foreground">
                Deixe em branco para usar os valores padrao.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label
                    htmlFor="scoringCorrectWinner"
                    className="text-[10px] font-medium"
                  >
                    Vencedor
                  </label>
                  <Input
                    id="scoringCorrectWinner"
                    name="scoringCorrectWinner"
                    type="number"
                    min={0}
                    placeholder={`${DEFAULT_SCORING.correct_winner}`}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="scoringExactScore"
                    className="text-[10px] font-medium"
                  >
                    Placar exato
                  </label>
                  <Input
                    id="scoringExactScore"
                    name="scoringExactScore"
                    type="number"
                    min={0}
                    placeholder={`${DEFAULT_SCORING.exact_score}`}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="scoringCorrectScorer"
                    className="text-[10px] font-medium"
                  >
                    Artilheiro
                  </label>
                  <Input
                    id="scoringCorrectScorer"
                    name="scoringCorrectScorer"
                    type="number"
                    min={0}
                    placeholder={`${DEFAULT_SCORING.correct_scorer}`}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Padrao: {DEFAULT_SCORING.correct_winner} pts vencedor + {DEFAULT_SCORING.exact_score} pts placar exato + {DEFAULT_SCORING.correct_scorer} pts artilheiro
              </p>
            </CardContent>
          )}
        </Card>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? "Criando..." : "Criar Bolao"}
        </Button>
      </form>
    </div>
  );
}
