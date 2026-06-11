import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/user";
import { getUserGroups } from "@/lib/queries/groups";

const GUERREIROS_ID = "7a8cb3af-7238-4df1-b267-fe192d69843e";

/**
 * Tela inicial dos jogadores: manda direto pro ranking do bolao principal
 * (prioriza o Bolao dos guerreiros; senao, o primeiro bolao do usuario).
 * E o start_url do PWA e o destino pos-login.
 */
export default async function InicioPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login?redirect=/inicio");

  const groups = await getUserGroups(userId);
  if (groups.length === 0) redirect("/boloes");

  const preferred =
    groups.find((g) => g.group_id === GUERREIROS_ID) ?? groups[0];
  redirect(`/boloes/${preferred.group_id}`);
}
