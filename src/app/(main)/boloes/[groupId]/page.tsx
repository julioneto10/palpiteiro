import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers, getUserMembership } from "@/lib/queries/groups";
import { getScoringConfig } from "@/lib/constants/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupActions } from "@/components/group/group-actions";
import { ShareInvite } from "@/components/group/share-invite";
import { LiveRefresh } from "@/components/shared/live-refresh";
import { RankingBoard, type RankingEntry } from "@/components/shared/podium";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings, Tv, Users } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroupById(groupId);
  return { title: group?.name ?? "Bolao" };
}

export default async function BolaoDetalhePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const group = await getGroupById(groupId);
  if (!group) notFound();

  const members = await getGroupMembers(groupId);
  const membership = user ? await getUserMembership(groupId, user.id) : null;
  const scoring = getScoringConfig(group.scoring_config);

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const isMember = !!membership;

  // Acertos / cravadas pra sub-linha do ranking (independem da config do bolao)
  const { data: lbRows } = members.length
    ? await supabase
        .from("global_leaderboard")
        .select("user_id, correct_winners, exact_scores")
        .in(
          "user_id",
          members.map((m) => m.user_id)
        )
    : { data: [] };
  const statsByUser = new Map(
    (lbRows ?? []).map((r) => [r.user_id as string, r])
  );

  const entries: RankingEntry[] = members.map((m) => {
    const stats = statsByUser.get(m.user_id);
    return {
      userId: m.user_id,
      name: m.profile?.display_name ?? "Anonimo",
      avatarUrl: m.profile?.avatar_url ?? null,
      points: m.total_points,
      correctWinners: stats?.correct_winners ?? 0,
      exactScores: stats?.exact_scores ?? 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/boloes">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-xl font-extrabold">
              {group.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {group.type === "open" ? "Aberto" : "Privado"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                <Users className="inline h-3 w-3 mr-0.5" />
                {members.length}/{group.max_members}
              </span>
            </div>
          </div>
        </div>
        {(isOwner || isAdmin) && (
          <Link href={`/boloes/${groupId}/config`}>
            <Button variant="ghost" size="icon-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-sm text-muted-foreground">{group.description}</p>
      )}

      {/* Scoring summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              {scoring.correct_winner}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Vencedor
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              +{scoring.exact_score}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Placar exato
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="p-2 text-center">
            <p className="font-heading text-2xl font-black text-primary leading-none">
              {scoring.correct_scorer}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">
              Artilheiro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite / Share */}
      {isMember && (
        <ShareInvite inviteCode={group.invite_code} groupName={group.name} />
      )}

      {/* Actions for non-members */}
      {!isMember && user && (
        <GroupActions groupId={groupId} inviteCode={group.invite_code} />
      )}

      {/* Stake info */}
      {group.stake_amount && (
        <Card size="sm">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Valor da aposta
            </span>
            <span className="font-heading font-bold text-primary">
              R$ {Number(group.stake_amount).toFixed(2)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Modo TV / Apresentacao — abre o ranking em tela cheia, ao vivo */}
      {isMember && (
        <Link href={`/tv/${groupId}`} target="_blank" className="block">
          <Button variant="outline" className="w-full gap-2">
            <Tv className="h-4 w-4" />
            Modo TV — mostrar ranking ao vivo
          </Button>
        </Link>
      )}

      {/* Leaderboard */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-heading text-[13px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Ranking ({members.length})
          </h2>
          <LiveRefresh intervalMs={300_000} />
        </div>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Toque num nome para ver os palpites da pessoa.
        </p>
        {entries.length > 0 ? (
          <RankingBoard
            entries={entries}
            currentUserId={user?.id}
            hrefFor={(userId) => `/boloes/${groupId}/jogador/${userId}`}
          />
        ) : (
          <div className="rounded-[22px] bg-card py-8 text-center text-sm text-muted-foreground">
            Nenhum membro ainda
          </div>
        )}
      </div>

      {/* Leave group */}
      {isMember && !isOwner && (
        <GroupActions
          groupId={groupId}
          isMember={true}
        />
      )}
    </div>
  );
}
