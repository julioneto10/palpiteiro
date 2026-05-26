import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const metadata = {
  title: "Notificacoes",
};

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-4xl">🔒</p>
        <p className="font-heading text-lg font-bold">
          Faca login para ver suas notificacoes
        </p>
      </div>
    );
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-extrabold">Notificacoes</h1>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={notif.is_read ? "opacity-60" : undefined}
            >
              <CardContent className="p-3 flex items-start gap-3">
                <Bell className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{notif.title}</p>
                  {notif.body && (
                    <p className="text-xs text-muted-foreground">
                      {notif.body}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🔔</p>
          <p className="font-heading text-lg font-bold">
            Nenhuma notificacao
          </p>
          <p className="text-sm text-muted-foreground">
            Voce sera notificado sobre resultados, desafios e mais.
          </p>
        </div>
      )}
    </div>
  );
}
