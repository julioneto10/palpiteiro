import { createClient } from "./server";

/**
 * Retorna apenas o id do usuario logado, de forma rapida.
 *
 * `auth.getClaims()` le a sessao do cookie e valida o JWT localmente
 * (busca a JWKS uma vez e cacheia), evitando o roundtrip de rede que o
 * `auth.getUser()` faz a cada chamada. O middleware ja revalida/atualiza
 * a sessao em toda requisicao, entao aqui basta ler os claims.
 *
 * Faz fallback para `getUser()` caso a verificacao local nao seja possivel
 * (ex.: projeto com segredo simetrico legado) — nunca fica mais lento.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    if (!error && typeof sub === "string") return sub;
  } catch {
    // ignora e cai no fallback
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
