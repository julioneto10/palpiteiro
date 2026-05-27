import {
  getGroupByInviteCodeAdmin,
  getGroupMemberCountAdmin,
} from "@/lib/queries/groups";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinFromInvite } from "@/components/group/join-from-invite";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByInviteCodeAdmin(code);
  return {
    title: group ? `Entrar no bolao: ${group.name}` : "Convite",
    description: group
      ? `Voce foi convidado para o bolao "${group.name}" no Palpiteiro!`
      : "Convite invalido",
  };
}

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByInviteCodeAdmin(code);

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-4xl">😕</p>
            <h1 className="font-heading text-xl font-bold">
              Convite invalido
            </h1>
            <p className="text-sm text-muted-foreground">
              Este codigo de convite nao existe ou o bolao foi desativado.
            </p>
            <Link href="/">
              <Button className="w-full">Ir para o Palpiteiro</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const memberCount = await getGroupMemberCountAdmin(group.id);

  // If user is logged in, check if already a member
  if (user) {
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      redirect(`/boloes/${group.id}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-4xl">⚽</p>
            <h1 className="font-heading text-xl font-bold">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {group.type === "open" ? "Aberto" : "Privado"}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount}/{group.max_members}
              </span>
            </div>
          </div>

          {group.stake_amount && (
            <div className="text-center py-2 border-y">
              <span className="text-xs text-muted-foreground">Aposta: </span>
              <span className="font-heading font-bold text-primary">
                R$ {Number(group.stake_amount).toFixed(2)}
              </span>
            </div>
          )}

          {user ? (
            <JoinFromInvite inviteCode={code} groupId={group.id} />
          ) : (
            <div className="space-y-2">
              <Link href={`/login?redirect=/convite/${code}`}>
                <Button className="w-full" size="lg">
                  Entrar e participar
                </Button>
              </Link>
              <p className="text-[10px] text-center text-muted-foreground">
                Faca login para entrar no bolao
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
