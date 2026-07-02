#!/usr/bin/env node
/**
 * Quem ainda nao palpitou? — Copa 2026
 *
 * Lista, por grupo (bolao), quais membros NAO enviaram palpite para os
 * proximos jogos que ainda estao abertos (kickoff no futuro). Considera o
 * cutoff de 10 min antes do kickoff como "ainda aberto".
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error("Faltam env vars."); process.exit(1); }

const CUTOFF_MIN = 10;
const now = new Date();

async function q(path) {
  // Pagina de 1000 em 1000 (limite padrao do PostgREST) ate esgotar.
  const PAGE = 1000;
  let from = 0, out = [];
  for (;;) {
    const r = await fetch(`${URL}/rest/v1/${path}`, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: `${from}-${from + PAGE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`);
    const batch = await r.json();
    out = out.concat(batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

const teamName = (t) => t?.name || t?.name_en || "?";

const [matches, groups, members, profiles, predictions, teams] = await Promise.all([
  q("matches?select=id,match_number,stage,kickoff_at,status,home_team_id,away_team_id,group_letter&order=kickoff_at.asc"),
  q("groups?select=id,name"),
  q("group_members?select=group_id,user_id,role"),
  q("profiles?select=id,display_name,username"),
  q("predictions?select=user_id,match_id"),
  q("teams?select=id,name,name_en"),
]);

const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
const groupById = Object.fromEntries(groups.map((g) => [g.id, g]));

// jogos ainda ABERTOS para palpite: kickoff - 10min > agora
const openMatches = matches.filter((m) => {
  const cutoff = new Date(new Date(m.kickoff_at).getTime() - CUTOFF_MIN * 60000);
  return cutoff > now && m.status === "scheduled";
});

// set de palpites: user|match
const predSet = new Set(predictions.map((p) => `${p.user_id}|${p.match_id}`));

// membros por grupo
const membersByGroup = {};
for (const m of members) (membersByGroup[m.group_id] ??= []).push(m.user_id);

const nome = (uid) => profById[uid]?.display_name || profById[uid]?.username || uid.slice(0, 8);
const label = (m) => {
  const h = teamName(teamById[m.home_team_id]);
  const a = teamName(teamById[m.away_team_id]);
  const dt = new Date(m.kickoff_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return `#${m.match_number ?? "?"} ${h} x ${a} (${dt})`;
};

console.log(`\nAgora: ${now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
console.log(`Jogos ainda abertos para palpite: ${openMatches.length}\n`);

if (openMatches.length === 0) {
  console.log("Nenhum jogo aberto no momento (todos ja comecaram/fecharam o cutoff).");
  process.exit(0);
}

// Foco: proximos 3 jogos abertos
const focus = openMatches.slice(0, 3);

for (const g of groups) {
  const gm = membersByGroup[g.id] || [];
  if (gm.length === 0) continue;
  console.log(`\n======== BOLAO: ${g.name}  (${gm.length} membros) ========`);
  for (const m of focus) {
    const faltam = gm.filter((uid) => !predSet.has(`${uid}|${m.id}`));
    const tag = faltam.length === 0 ? "✅ todos palpitaram" : `❌ faltam ${faltam.length}`;
    console.log(`\n  ${label(m)}  -> ${tag}`);
    if (faltam.length > 0) {
      for (const uid of faltam) console.log(`       - ${nome(uid)}`);
    }
  }
}

// Resumo: proximo jogo
const next = focus[0];
console.log(`\n\n==== RESUMO PROXIMO JOGO: ${label(next)} ====`);
let totalMembros = 0, totalFaltam = 0;
for (const g of groups) {
  const gm = membersByGroup[g.id] || [];
  if (!gm.length) continue;
  const faltam = gm.filter((uid) => !predSet.has(`${uid}|${next.id}`));
  totalMembros += gm.length; totalFaltam += faltam.length;
}
console.log(`Total de participacoes: ${totalMembros} | Ja palpitaram: ${totalMembros - totalFaltam} | Faltam: ${totalFaltam}`);
