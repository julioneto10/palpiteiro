#!/usr/bin/env node
/**
 * Robo de placares — Copa 2026.
 *
 * Le os jogos da API publica worldcup26.ir (/get/games, sem auth), casa cada
 * jogo FINALIZADO com o nosso `matches` (pelos nomes dos times) e aplica o
 * placar via RPC `apply_match_result` (service_role). A RPC ja roda
 * `recompute_totals()`, entao o ranking (e a tela /tv) atualiza sozinho.
 *
 * Idempotente: so chama a RPC quando o jogo ainda nao esta `finished` com o
 * mesmo placar — nada de re-pontuar nem poluir a auditoria.
 *
 * Env:
 *   SUPABASE_URL                  (publico — pode ficar no workflow)
 *   SUPABASE_SERVICE_ROLE_KEY     (secreto — GitHub Actions secret)
 *   DRY_RUN=1                     (opcional: so loga o casamento, nao aplica)
 */

const API_URL = "https://worldcup26.ir/get/games";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

// Grafias da API -> nosso teams.name_en
const NAME_ALIASES = {
  "Cape Verde": "Cabo Verde",
  "Curaçao": "Curacao",
  "Czech Republic": "Czechia",
  "Democratic Republic of the Congo": "DR Congo",
};

const norm = (n) => NAME_ALIASES[n?.trim()] ?? n?.trim();

// time "indefinido" na fonte (mata-mata ainda nao chaveado)
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

async function runOnce() {
  // 1. API publica
  const apiRes = await fetch(API_URL);
  if (!apiRes.ok) throw new Error(`API ${API_URL} -> ${apiRes.status}`);
  const games = (await apiRes.json()).games ?? [];

  // 2. Nosso estado
  const teams = await sb("teams?select=id,name_en");
  const byName = new Map(
    teams.filter((t) => t.name_en).map((t) => [t.name_en.trim(), t.id])
  );
  const matches = await sb(
    "matches?select=id,match_number,stage,home_team_id,away_team_id,home_score,away_score,status"
  );

  // 2b. Auto-fill do mata-mata: assim que a fonte define os DOIS times de um
  // jogo de mata-mata ainda TBD no nosso banco, gravamos o confronto — o jogo
  // vira palpitavel sozinho. Mapeia API.id (string) <-> nosso match_number.
  // So toca jogo com AMBOS os times NULL; nunca sobrescreve. Idempotente.
  let filled = 0;
  const byNumber = new Map(matches.map((m) => [m.match_number, m]));
  for (const g of games) {
    if (g.type === "group") continue;
    const m = byNumber.get(Number(g.id));
    if (!m || m.home_team_id || m.away_team_id) continue;
    if (!isDefined(g.home_team_name_en) || !isDefined(g.away_team_name_en)) continue;
    const homeId = byName.get(norm(g.home_team_name_en));
    const awayId = byName.get(norm(g.away_team_name_en));
    if (!homeId || !awayId) continue;
    if (!DRY_RUN) {
      await sb(`matches?id=eq.${m.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ home_team_id: homeId, away_team_id: awayId }),
      });
    }
    // reflete na memoria pra entrar no matchByPair desta mesma execucao
    m.home_team_id = homeId;
    m.away_team_id = awayId;
    filled++;
    console.log(
      `  ✓ confronto definido #${m.match_number} ${m.stage}${DRY_RUN ? " (dry)" : ""}`
    );
  }

  // chave = par nao-ordenado de team ids
  const pairKey = (a, b) => [a, b].sort().join("|");
  const matchByPair = new Map();
  for (const m of matches) {
    if (m.home_team_id && m.away_team_id) {
      matchByPair.set(pairKey(m.home_team_id, m.away_team_id), m);
    }
  }

  let finished = 0,
    applied = 0,
    skipped = 0,
    unmatched = 0;

  for (const g of games) {
    const isFinished = String(g.finished).toUpperCase() === "TRUE";
    if (!isFinished) continue;
    finished++;

    const homeName = norm(g.home_team_name_en);
    const awayName = norm(g.away_team_name_en);
    const homeId = byName.get(homeName);
    const awayId = byName.get(awayName);
    if (!homeId || !awayId) {
      unmatched++;
      console.warn(
        `  ! sem casar times: "${g.home_team_name_en}" x "${g.away_team_name_en}"`
      );
      continue;
    }

    const m = matchByPair.get(pairKey(homeId, awayId));
    if (!m) {
      unmatched++;
      console.warn(`  ! sem casar jogo: ${homeName} x ${awayName}`);
      continue;
    }

    // Orienta o placar conforme o nosso mando de campo
    const apiHome = parseInt(g.home_score, 10);
    const apiAway = parseInt(g.away_score, 10);
    if (Number.isNaN(apiHome) || Number.isNaN(apiAway)) continue;
    const sameHome = m.home_team_id === homeId;
    const ourHome = sameHome ? apiHome : apiAway;
    const ourAway = sameHome ? apiAway : apiHome;

    // Idempotencia
    if (
      m.status === "finished" &&
      m.home_score === ourHome &&
      m.away_score === ourAway
    ) {
      skipped++;
      continue;
    }

    const label = `${homeName} ${apiHome}x${apiAway} ${awayName}`;
    if (DRY_RUN) {
      console.log(`  [dry] aplicaria ${label} (match ${m.id})`);
      applied++;
      continue;
    }

    await sb("rpc/apply_match_result", {
      method: "POST",
      body: JSON.stringify({
        p_match_id: m.id,
        p_home: ourHome,
        p_away: ourAway,
      }),
    });
    applied++;
    console.log(`  ✓ aplicado ${label}`);
  }

  console.log(
    `[${new Date().toISOString()}] confrontos_definidos=${filled} finalizados=${finished} aplicados=${applied} ignorados=${skipped} sem_casar=${unmatched}${DRY_RUN ? " (DRY)" : ""}`
  );
  return { filled, finished, applied, skipped, unmatched };
}

// Loop interno: cobre atrasos do cron do GitHub sem depender da pontualidade
// dele. LOOPS x SLEEP define a janela coberta por execucao.
const LOOPS = parseInt(process.env.LOOPS || "1", 10);
const SLEEP_MS = parseInt(process.env.SLEEP_MS || "90000", 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < LOOPS; i++) {
  try {
    await runOnce();
  } catch (e) {
    console.error("  erro na iteracao:", e.message);
  }
  if (i < LOOPS - 1) await sleep(SLEEP_MS);
}
