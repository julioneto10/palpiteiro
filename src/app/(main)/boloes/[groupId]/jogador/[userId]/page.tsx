import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGroupById } from "@/lib/queries/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PredictionCard } from "@/components/prediction/prediction-card";
import type { MatchWithTeams, Prediction } from "@/lib/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string; userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  return { title: `Palpites de ${data?.display_name ?? "jogador"}` };
}

export default async function JogadorPalpitesPage({
  params,
}: {
  params: Promise<{ groupId: string; userId: string }>;
}) {
  const { groupId, userId } = await params;
  const supabase = await createClient();

  const group = await getGroupById(groupId);
  if (!group) notFound();

  const [{ data: member }, { data: profileRow }, { data: rawPredictions }] =
    await Promise.all([
    supabase
      .from("group_members")
      .select("total_points")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("profiles")
      .select("display_name, avatar_url, username")
      .eq("id", userId)
      .single(),
    supabase
      .from("predictions")
      .select(
        `*,
         match:matches(
           *,
           home_team:teams!matches_home_team_id_fkey(*),
           away_team:teams!matches_away_team_id_fkey(*)
         )`
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (!member) notFound();

  const profile = profileRow as {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;

  const predictions = (rawPredictions ?? []) as (Prediction & {
    match: MatchWithTeams;
  })[];

  // Ordena por data do jogo (mais recente primeiro), jogos finalizados no topo.
  predictions.sort(
    (a, b) =>
      new Date(b.match.kickoff_at).getTime() -
      new Date(a.match.kickoff_at).getTime()
  );

  const exactScores = predictions.filter((p) => p.is_exact_score).length;
  const correctWinners = predictions.filter((p) => p.is_correct_winner).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/boloes/${groupId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-sm font-bold">
            {(profile?.display_name ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-xl font-extrabold leading-none">
            {profile?.display_name ?? "Jogador"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {member.total_points} pts · {correctWinners} acertos · {exactScores}{" "}
            placares exatos
          </p>
        </div>
      </div>

      {/* Lista de palpites */}
      {predictions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Esse jogador ainda nao tem palpites.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {predictions.map((p) => (
            <PredictionCard key={p.id} prediction={p} match={p.match} />
          ))}
        </div>
      )}
    </div>
  );
}
