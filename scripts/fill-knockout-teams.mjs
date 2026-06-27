#!/usr/bin/env node
/**
 * Preenche os times dos jogos de mata-mata — Copa 2026.
 *
 * Le os jogos da MESMA API publica que o robo de placares usa
 * (worldcup26.ir/get/games) e, para cada jogo de mata-mata cujos DOIS times
 * ja estao definidos na fonte, grava home_team_id/away_team_id no nosso
 * `matches` — liberando o jogo para palpite (jogo agendado + 2 times).
 *
 * Seguranca:
 *   - So mexe em jogos de mata-mata (stage != group).
 *   - So preenche quando home_team_id E away_team_id estao AMBOS NULL hoje
 *     (nunca sobrescreve um confronto ja definido).
 *   - So preenche quando os DOIS times da API estao definidos e casam com o
 *     nosso teams.name_en (senao pula — nada de chute).
 *   - Mapeia API.id <-> nosso match_number (verificado: r32 73-76 batem em
 *     data/estadio/horario). Idempotente: rodar de novo nao faz nada.
 *
 * Env:
 *   SUPABASE_URL                  (publico)
 *   SUPABASE_SERVICE_ROLE_KEY     (secreto)
 *   DRY_RUN=1                     (so loga o que faria; nao grava)
 */

const API_URL = "https://worldcup26.ir/get/games";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

// Grafias da API -> nosso teams.name_en (mesma tabela do robo de placares)
const NAME_ALIASES = {
  "Cape Verde": "Cabo Verde",
  "Curaçao": "Curacao",
  "Czech Republic": "Czechia",
  "Democratic Republic of the Congo": "DR Congo",
};
const norm = (n) => NAME_ALIASES[n?.trim()] ?? n?.trim();

// times "indefinidos" na fonte
const isDefined = (n) => {
  const v = n?.trim();
  return v && v.toLowerCase() !== "none" && v.toLowerCase() !== "null";
};

async function sb(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${path} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

const apiRes = await fetch(API_URL);
if (!apiRes.ok) throw new Error(`API ${API_URL} -> ${apiRes.status}`);
const games = (await apiRes.json()).games ?? [];

const teams = await sb("teams?select=id,name,name_en");
const byName = new Map(
  teams.filter((t) => t.name_en).map((t) => [t.name_en.trim(), t.id])
);
const nameById = new Map(teams.map((t) => [t.id, t.name]));

// nossos jogos de mata-mata, por match_number
const matches = await sb(
  "matches?stage=neq.group&select=id,match_number,stage,home_team_id,away_team_id,status,kickoff_at&order=match_number"
);
const byNumber = new Map(matches.map((m) => [m.match_number, m]));

let filled = 0,
  alreadySet = 0,
  notDefined = 0,
  unmatched = 0;

for (const g of games) {
  if (g.type === "group") continue;
  const m = byNumber.get(Number(g.id));
  if (!m) continue; // jogo da API sem correspondente (nao deveria acontecer)

  // ja tem confronto definido no banco -> nao toca
  if (m.home_team_id || m.away_team_id) {
    alreadySet++;
    continue;
  }

  // fonte ainda nao definiu os dois times
  if (!isDefined(g.home_team_name_en) || !isDefined(g.away_team_name_en)) {
    notDefined++;
    continue;
  }

  const homeName = norm(g.home_team_name_en);
  const awayName = norm(g.away_team_name_en);
  const homeId = byName.get(homeName);
  const awayId = byName.get(awayName);
  if (!homeId || !awayId) {
    unmatched++;
    console.warn(
      `  ! sem casar times (#${g.id} ${m.stage}): "${g.home_team_name_en}" x "${g.away_team_name_en}"`
    );
    continue;
  }

  const label = `#${m.match_number} ${m.stage}: ${nameById.get(homeId)} x ${nameById.get(awayId)}  [${m.kickoff_at}]`;
  if (DRY_RUN) {
    console.log(`  [dry] preencheria ${label}`);
    filled++;
    continue;
  }

  await sb(`matches?id=eq.${m.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ home_team_id: homeId, away_team_id: awayId }),
  });
  filled++;
  console.log(`  ✓ preenchido ${label}`);
}

console.log(
  `[${new Date().toISOString()}] preenchidos=${filled} ja_definidos=${alreadySet} fonte_indefinida=${notDefined} sem_casar=${unmatched}${DRY_RUN ? " (DRY)" : ""}`
);
