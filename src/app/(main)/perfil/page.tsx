import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Settings, LogOut, Share2 } from "lucide-react";

export const metadata = {
  title: "Perfil",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-4xl">👤</p>
        <p className="font-heading text-lg font-bold">
          Faca login para ver seu perfil
        </p>
        <Link href="/login">
          <Button>Entrar</Button>
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto border-4 border-primary/20">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-xl font-extrabold">
              {profile?.display_name ?? "Palpiteiro"}
            </h1>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
          </div>
          <Link href="/perfil/editar">
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-3.5 w-3.5" />
              Editar perfil
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-extrabold text-primary">
              {profile?.total_points ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Pontos Totais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-extrabold">
              {profile?.total_predictions ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Palpites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-extrabold text-success">
              {profile?.correct_predictions ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Acertos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-extrabold text-accent-foreground">
              {profile?.exact_scores ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">
              Placares Exatos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral */}
      {profile?.referral_code && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Convide amigos</p>
              <p className="text-xs text-muted-foreground">
                Codigo: {profile.referral_code}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full text-destructive hover:text-destructive gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
