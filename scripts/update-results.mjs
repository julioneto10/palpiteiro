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

// Overrides de TEMPO NORMAL. O bolao conta apenas o placar dos 90 min. Alguns
// jogos de mata-mata terminam empatados no tempo normal e sao decididos na
// prorrogacao/penaltis; a API (worldcup26.ir) devolve o placar JA com os gols
// da prorrogacao, entao fixamos aqui o placar correto e ignoramos o da API.
// Chave = nosso match_number; valores na NOSSA orientacao [casa, fora].
//   #82 Belgica x Senegal: 2-2 no tempo normal (Belgica venceu 3-2 na prorrog.)
//   #86 Argentina x Cabo Verde: 1-1 no tempo normal (Argentina venceu 3-2 na prorrog.)
const NORMAL_TIME_OVERRIDES = {
  82: [2, 2],
  86: [1, 1],
};

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

// Reescreve predictions.points_earned para o padrao 1/2/0 (1 vencedor, 2 exato,
// 0 artilheiro) e recalcula os totais. Espelha a DEFAULT_SCORING do app e a
// scoring_config dos boloes. So mexe em palpites ja pontuados (flags != null).
async function normalizeDefaultPoints() {
  const patch = (query, body) =>
    sb(`predictions?${query}`, { method: "PATCH", body: JSON.stringify(body) });
  await patch("is_exact_score=eq.true", { points_earned: 3 });
  await patch("is_correct_winner=eq.true&is_exact_score=eq.false", { points_earned: 1 });
  await patch("is_correct_winner=eq.false", { points_earned: 0 });
  await sb("scorer_predictions?points_earned=gt.0", {
    method: "PATCH",
    body: JSON.stringify({ points_earned: 0 }),
  });
  await sb("rpc/recompute_totals", { method: "POST", body: "{}" });
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
    let ourHome = sameHome ? apiHome : apiAway;
    let ourAway = sameHome ? apiAway : apiHome;

    // Tempo normal manda: se ha override, usa ele e ignora a API (que pode
    // incluir gols da prorrogacao). Como isso entra antes da idempotencia, o
    // cron passa a considerar o placar de tempo normal como o "certo" e nao
    // fica revertendo pro placar da API.
    const override = NORMAL_TIME_OVERRIDES[m.match_number];
    if (override) {
      [ourHome, ourAway] = override;
    }

    // Idempotencia
    if (
      m.status === "finished" &&
      m.home_score === ourHome &&
      m.away_score === ourAway
    ) {
      skipped++;
      continue;
    }

    const label =
      `${homeName} ${ourHome}x${ourAway} ${awayName}` +
      (override ? ` (tempo normal; API dizia ${apiHome}x${apiAway})` : "");
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

  // Auto-normaliza a pontuacao PADRAO (predictions.points_earned + leaderboard
  // global) para 1/2/0. A funcao score_match do banco ainda usa 3/5 por dentro,
  // entao todo jogo recem-aplicado grava 3/5; aqui re-escrevemos para o padrao
  // atual e recalculamos os totais. Idempotente e barato. (Ver migration 00013:
  // quando aplicada, isto vira um no-op — os valores ja saem 1/2/0 da funcao.)
  if (applied > 0 && !DRY_RUN) {
    await normalizeDefaultPoints();
    console.log("  ✓ pontuacao padrao normalizada para 1/2/0 (points_earned + totais)");
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
