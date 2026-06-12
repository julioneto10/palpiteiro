#!/usr/bin/env python3
"""Sincroniza resultados da Copa 2026 (TheSportsDB) com o Palpiteiro.

- Mapeia cada evento da API a um jogo do app por (kickoff UTC + times).
- No 1o casamento, grava o idEvent da API em matches.external_id (trava por id).
- Aplica jogos FINALIZADOS pela funcao oficial apply_match_result
  (pontua + audita, idempotente). So aplica se o placar mudou.

Uso:
  python3 sync-resultados.py <SUPABASE_URL> <SERVICE_KEY>            # DRY-RUN
  python3 sync-resultados.py <SUPABASE_URL> <SERVICE_KEY> --apply    # grava
"""
import sys, json, unicodedata, urllib.request, urllib.parse

URL = sys.argv[1]
KEY = sys.argv[2]
APPLY = "--apply" in sys.argv[3:]
SPORTSDB_KEY = "3"                       # chave free/teste; trocavel por premium
WC_LEAGUE = "4429"                       # FIFA World Cup
SEASON = "2026"
ADMIN_ID = "bfb64824-e52c-409f-bd76-010e36738c24"  # juliomiguelvitor (admin)

# code do app -> nomes aceitos na API (1o = canonico). Normalizado na comparacao.
TEAM_NAMES = {
    "MEX": ["Mexico"], "RSA": ["South Africa"], "KOR": ["South Korea"],
    "CZE": ["Czech Republic", "Czechia"], "CAN": ["Canada"],
    "BIH": ["Bosnia-Herzegovina", "Bosnia and Herzegovina"], "QAT": ["Qatar"],
    "SUI": ["Switzerland"], "BRA": ["Brazil"], "MAR": ["Morocco"],
    "SCO": ["Scotland"], "HAI": ["Haiti"], "USA": ["USA", "United States"],
    "PAR": ["Paraguay"], "AUS": ["Australia"], "TUR": ["Turkey", "Turkiye"],
    "CIV": ["Ivory Coast", "Cote d'Ivoire"], "GER": ["Germany"],
    "CUW": ["Curacao"], "ECU": ["Ecuador"], "TUN": ["Tunisia"], "JPN": ["Japan"],
    "NED": ["Netherlands"], "SWE": ["Sweden"], "NZL": ["New Zealand"],
    "BEL": ["Belgium"], "EGY": ["Egypt"], "IRN": ["Iran"], "URU": ["Uruguay"],
    "KSA": ["Saudi Arabia"], "CPV": ["Cape Verde", "Cabo Verde"], "ESP": ["Spain"],
    "IRQ": ["Iraq"], "FRA": ["France"], "SEN": ["Senegal"], "NOR": ["Norway"],
    "JOR": ["Jordan"], "ARG": ["Argentina"], "ALG": ["Algeria"], "AUT": ["Austria"],
    "COD": ["DR Congo", "Congo DR", "Democratic Republic of Congo"],
    "POR": ["Portugal"], "UZB": ["Uzbekistan"], "COL": ["Colombia"],
    "PAN": ["Panama"], "ENG": ["England"], "CRO": ["Croatia"], "GHA": ["Ghana"],
}


def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return "".join(c for c in s.lower() if c.isalnum())


# code -> set de nomes normalizados
NAME2 = {c: {norm(n) for n in names} for c, names in TEAM_NAMES.items()}


def sb(method, path, body=None, prefer=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY,
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(URL + path, data=data, headers=h, method=method)
    r = urllib.request.urlopen(req)
    txt = r.read().decode()
    return json.loads(txt) if txt.strip() else None


def api_events():
    u = (f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_KEY}"
         f"/eventsseason.php?id={WC_LEAGUE}&s={SEASON}")
    r = urllib.request.urlopen(u, timeout=30)
    return (json.load(r).get("events") or [])


def teams_match(app_h, app_a, api_h, api_a):
    nh, na = norm(api_h), norm(api_a)
    return nh in NAME2.get(app_h, set()) and na in NAME2.get(app_a, set())


# ----- carrega jogos do app -----
matches = sb("GET", "/rest/v1/matches?select=id,external_id,kickoff_at,status,"
             "home_score,away_score,"
             "home_team:teams!matches_home_team_id_fkey(code),"
             "away_team:teams!matches_away_team_id_fkey(code)")
by_extid = {m["external_id"]: m for m in matches if m["external_id"]}
# index por timestamp UTC (HH:MM:SS em Z) -> lista
by_ts = {}
for m in matches:
    # normaliza kickoff p/ 'YYYY-MM-DDTHH:MM:SS'
    ts = m["kickoff_at"].replace("+00:00", "").replace("Z", "")[:19]
    by_ts.setdefault(ts, []).append(m)

events = api_events()
print(f"API: {len(events)} eventos | app: {len(matches)} jogos "
      f"({'APLICANDO' if APPLY else 'DRY-RUN'})\n")

applied = mapped = skipped = unmatched = 0
for e in events:
    if e.get("intHomeScore") is None or e.get("intAwayScore") is None:
        continue  # sem placar -> ainda nao finalizou
    hs, as_ = int(e["intHomeScore"]), int(e["intAwayScore"])
    ts = (e.get("strTimestamp") or "")[:19]
    idev = e.get("idEvent")

    # 1) por external_id ja gravado
    m = by_extid.get(idev)
    # 2) por timestamp + times
    if not m:
        for cand in by_ts.get(ts, []):
            if teams_match(cand["home_team"]["code"], cand["away_team"]["code"],
                           e["strHomeTeam"], e["strAwayTeam"]):
                m = cand
                break

    tag = f'{e["strHomeTeam"]} {hs}x{as_} {e["strAwayTeam"]} ({e.get("dateEvent")})'
    if not m:
        print(f"  ⚠ SEM MATCH: {tag}")
        unmatched += 1
        continue

    mapped += 1
    # grava external_id se faltava
    if not m["external_id"] and APPLY:
        sb("PATCH", f"/rest/v1/matches?id=eq.{m['id']}", {"external_id": idev})

    already = (m["status"] == "finished" and m["home_score"] == hs
               and m["away_score"] == as_)
    if already:
        print(f"  = ja aplicado: {tag}")
        skipped += 1
        continue

    if APPLY:
        sb("POST", "/rest/v1/rpc/apply_match_result", {
            "p_match_id": m["id"], "p_home": hs, "p_away": as_,
            "p_scorer_player_ids": [], "p_actor": ADMIN_ID,
        })
        print(f"  ✓ APLICADO: {tag}")
    else:
        print(f"  → aplicaria: {tag}")
    applied += 1

print(f"\nfinalizados na API={applied+skipped} | "
      f"mapeados={mapped} | a aplicar={applied} | ja ok={skipped} | "
      f"sem match={unmatched}")
if not APPLY:
    print("DRY-RUN: nada gravado. Rode com --apply para gravar.")
