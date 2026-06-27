import { notFound } from "next/navigation";
import { getMatchById } from "@/lib/queries/matches";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/supabase/user";
import { TeamBadge } from "@/components/shared/team-badge";
import { MatchStatusBadge } from "@/components/match/match-status-badge";
import { PredictionForm } from "@/components/prediction/prediction-form";
import { Card, CardContent } from "@/components/ui/card";
import { STAGE_LABELS } from "@/lib/constants/scoring";
import { formatFullDateBRT, formatTimeBRT } from "@/lib/utils/date";
import { MapPin, Clock } from "lucide-react";
import type { MatchStage, Prediction } from "@/lib/types/database";
import Link from "next/link";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { matchId } = await params;
  const match = await getMatchById(matchId);
  if (!match) return { title: "Jogo nao encontrado" };

  const home = match.home_team?.name ?? "A definir";
  const away = match.away_team?.name ?? "A definir";
  return { title: `${home} x ${away}` };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { matchId } = await params;
  const match = await getMatchById(matchId);
  if (!match) notFound();

  const supabase = await createClient();
  const userId = await getUserId();

  const predResult = userId
    ? await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("match_id", matchId)
        .maybeSingle()
    : { data: null };

  const prediction = (predResult.data as Prediction | null) ?? null;

  const isLive = match.status === "live" || match.status === "half_time";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  return (
    <div className="space-y-4">
      {/* Match Header Card */}
      <Card className={isLive ? "border-destructive/50" : undefined}>
        <CardContent className="p-4 space-y-4">
          {/* Stage + Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {match.group_letter
                ? `Grupo ${match.group_letter}`
                : STAGE_LABELS[match.stage as MatchStage]}
            </span>
            <MatchStatusBadge status={match.status} />
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1 text-center space-y-2">
              <TeamBadge
                team={match.home_team}
                size="lg"
                showName={false}
                className="justify-center"
              />
              <p className="font-medium text-sm">
                {match.home_team?.name ?? "A definir"}
              </p>
            </div>

            <div className="px-4 text-center">
              {isScheduled ? (
                <div className="space-y-1">
                  <p className="font-heading text-3xl font-extrabold text-muted-foreground">
                    vs
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {formatTimeBRT(match.kickoff_at)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-heading text-4xl font-extrabold tabular-nums">
                    {match.home_score ?? 0}
                  </span>
                  <span className="text-xl text-muted-foreground">-</span>
                  <span className="font-heading text-4xl font-extrabold tabular-nums">
                    {match.away_score ?? 0}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center space-y-2">
              <TeamBadge
                team={match.away_team}
                size="lg"
                showName={false}
                className="justify-center"
              />
              <p className="font-medium text-sm">
                {match.away_team?.name ?? "A definir"}
              </p>
            </div>
          </div>

          {/* Match Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatFullDateBRT(match.kickoff_at)}</span>
            </div>
            {match.stadium && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {match.stadium}
                  {match.city && `, ${match.city}`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form de palpite: jogos agendados do mata-mata (fase de grupos
          encerrada para palpites). */}
      {userId && isScheduled && match.stage !== "group" && (
        <PredictionForm match={match} existingPrediction={prediction} />
      )}

      {/* Jogo de grupo ainda agendado: palpites encerrados */}
      {userId && isScheduled && match.stage === "group" && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-1">
            <p className="text-2xl">🔒</p>
            <p className="text-sm font-medium">Fase de grupos encerrada</p>
            <p className="text-xs text-muted-foreground">
              Os palpites agora sao so do mata-mata.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show existing prediction for live/finished matches */}
      {userId && !isScheduled && prediction && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold mb-2">Seu Palpite</h3>
            <div className="flex items-center justify-center gap-4">
              <span className="font-heading text-2xl font-extrabold">
                {prediction.predicted_home_score}
              </span>
              <span className="text-muted-foreground">x</span>
              <span className="font-heading text-2xl font-extrabold">
                {prediction.predicted_away_score}
              </span>
            </div>
            {isFinished && (
              <div className="text-center mt-2">
                {prediction.is_exact_score ? (
                  <p className="text-sm font-bold text-success">
                    Placar exato! +{prediction.points_earned} pontos
                  </p>
                ) : prediction.is_correct_winner ? (
                  <p className="text-sm font-bold text-primary">
                    Vencedor correto! +{prediction.points_earned} pontos
                  </p>
                ) : prediction.is_correct_winner === false ? (
                  <p className="text-sm text-destructive">
                    Errou dessa vez. 0 pontos
                  </p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Not logged in */}
      {!userId && isScheduled && (
        <Card className="border-dashed border-primary/30">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-3xl">🔮</p>
            <p className="font-medium">Faca seu palpite!</p>
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary font-medium hover:underline">
                Entre na sua conta
              </Link>{" "}
              para dar seu palpite neste jogo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
