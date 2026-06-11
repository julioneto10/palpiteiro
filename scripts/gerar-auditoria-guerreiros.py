#!/usr/bin/env python3
"""Gera um HTML de auditoria com todos os palpites do 'Bolao dos guerreiros'.
- Matriz em ordem cronologica real (dia a dia, do 1o ao ultimo jogo).
- Clique no nome de qualquer membro -> auditoria completa daquela pessoa.
"""
import sys, json, html, urllib.request
from datetime import datetime, timezone, timedelta

URL, KEY = sys.argv[1], sys.argv[2]
GID = "7a8cb3af-7238-4df1-b267-fe192d69843e"
BRT = timezone(timedelta(hours=-3))
WD = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]


def get(path):
    req = urllib.request.Request(
        URL + "/rest/v1/" + path,
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY},
    )
    return json.load(urllib.request.urlopen(req))


def get_all(path):
    """Pagina ate o fim (PostgREST corta em 1000)."""
    out, off = [], 0
    while True:
        sep = "&" if "?" in path else "?"
        chunk = get(f"{path}{sep}limit=1000&offset={off}")
        out.extend(chunk)
        if len(chunk) < 1000:
            break
        off += 1000
    return out


# ----- coleta -----
group = get(f"groups?id=eq.{GID}&select=*")[0]

members = get(
    f"group_members?group_id=eq.{GID}"
    "&select=user_id,role,joined_at&order=joined_at.asc"
)
ids = ",".join(m["user_id"] for m in members)
profs = {
    p["id"]: (p.get("display_name") or p.get("username") or p["id"][:8])
    for p in get(f"profiles?id=in.({ids})&select=id,display_name,username")
}
for m in members:
    m["name"] = profs.get(m["user_id"], m["user_id"][:8])

# ORDEM CRONOLOGICA GLOBAL: por data/hora do jogo, depois numero.
matches = get(
    "matches?stage=eq.group"
    "&select=id,group_letter,match_number,kickoff_at,"
    "home_team:teams!matches_home_team_id_fkey(name,code),"
    "away_team:teams!matches_away_team_id_fkey(name,code)"
    "&order=kickoff_at.asc,match_number.asc"
)

preds = get_all(
    f"predictions?user_id=in.({ids})"
    "&select=user_id,match_id,predicted_home_score,predicted_away_score"
)
pred = {m["user_id"]: {} for m in members}
for p in preds:
    pred[p["user_id"]][p["match_id"]] = (
        p["predicted_home_score"], p["predicted_away_score"]
    )

TOTAL = len(matches)
for m in members:
    m["filled"] = len(pred[m["user_id"]])
# membros em ordem alfabetica (auditoria), dono fica marcado mas na ordem
members.sort(key=lambda m: m["name"].lower())


# ----- helpers -----
def esc(s):
    return html.escape(str(s))


def hc(mt):
    return mt["home_team"]["code"] if mt["home_team"] else "?"


def ac(mt):
    return mt["away_team"]["code"] if mt["away_team"] else "?"


def hn(mt):
    return mt["home_team"]["name"] if mt["home_team"] else "A definir"


def an(mt):
    return mt["away_team"]["name"] if mt["away_team"] else "A definir"


def dt_of(mt):
    return datetime.fromisoformat(mt["kickoff_at"]).astimezone(BRT)


def day_key(d):
    return d.strftime("%Y-%m-%d")


def day_label(d):
    return f"{WD[d.weekday()]}, {d.strftime('%d/%m')}"


gen_at = datetime.now(BRT).strftime("%d/%m/%Y %H:%M")

# ----- deteccao de palpites identicos -----
pairs = []
for i in range(len(members)):
    for j in range(i + 1, len(members)):
        a, b = members[i], members[j]
        pa, pb = pred[a["user_id"]], pred[b["user_id"]]
        shared = set(pa) & set(pb)
        if len(shared) < 10:
            continue
        same = sum(1 for mid in shared if pa[mid] == pb[mid])
        pairs.append((same / len(shared), same, len(shared), a["name"], b["name"]))
pairs.sort(reverse=True)
SUSP = 0.75
n_susp = sum(1 for p in pairs if p[0] >= SUSP)

# ----- dados para o JS (modal por pessoa) -----
matches_js = [
    {
        "id": mt["id"],
        "t": dt_of(mt).strftime("%H:%M"),
        "day": day_label(dt_of(mt)),
        "g": mt["group_letter"],
        "hc": hc(mt), "ac": ac(mt), "hn": hn(mt), "an": an(mt),
    }
    for mt in matches
]
members_js = [{"id": m["user_id"], "name": m["name"], "filled": m["filled"],
               "owner": m["role"] == "owner"} for m in members]
data_js = json.dumps(
    {"matches": matches_js, "members": members_js, "pred": pred},
    ensure_ascii=False,
)

# ----- matriz (ordenada por dia) -----
head_cols = "".join(
    f'<th class="m" data-uid="{esc(m["user_id"])}">'
    f'<div class="mname">{esc(m["name"])}</div>'
    f'<div class="mfill">{m["filled"]}/{TOTAL}</div></th>'
    for m in members
)

rows = []
cur_day = None
for mt in matches:
    d = dt_of(mt)
    dk = day_key(d)
    if dk != cur_day:
        cur_day = dk
        rows.append(
            f'<tr class="day"><td colspan="{len(members)+1}">'
            f"{esc(day_label(d))}</td></tr>"
        )
    label = (
        f'<div class="teams">{esc(hc(mt))} <span class="x">×</span> '
        f'{esc(ac(mt))}</div>'
        f'<div class="dt">{esc(d.strftime("%H:%M"))} '
        f'<span class="gtag">G{esc(mt["group_letter"])}</span></div>'
    )
    cells = []
    for m in members:
        pv = pred[m["user_id"]].get(mt["id"])
        cells.append(
            '<td class="p empty">·</td>' if pv is None
            else f'<td class="p">{pv[0]}<i>×</i>{pv[1]}</td>'
        )
    rows.append(f'<tr><td class="match">{label}</td>' + "".join(cells) + "</tr>")
rows_html = "\n".join(rows)

# ----- similaridade -----
if n_susp:
    h2 = ('⚠️ Palpites muito parecidos '
          '<small>(possivel copia — alguem preenchendo pelo outro?)</small>')
    hint = (f'{n_susp} par(es) com ≥{SUSP*100:.0f}% de placares identicos. '
            'Ordenado do mais ao menos parecido (min. 10 jogos em comum).')
else:
    h2 = '✓ Nenhum padrao suspeito de copia'
    hint = ('Nenhum par passou de 75% de placares identicos. Abaixo, os mais '
            'parecidos mesmo assim — so referencia.')
alert_rows = "".join(
    f'<tr class="{"susp" if r>=SUSP else ""}"><td>{esc(a)}</td><td>{esc(b)}</td>'
    f'<td class="num">{same}/{shared}</td>'
    f'<td class="num"><b>{r*100:.0f}%</b></td></tr>'
    for r, same, shared, a, b in pairs[:12]
) or '<tr><td colspan="4">Sem pares suficientes.</td></tr>'
alert_html = f"""<section class="card">
  <h2>{h2}</h2><p class="hint">{hint}</p>
  <table class="alert"><thead><tr><th>Membro A</th><th>Membro B</th>
    <th>Iguais</th><th>%</th></tr></thead><tbody>{alert_rows}</tbody></table>
</section>"""

# ----- resumo (nomes clicaveis) -----
done = sum(1 for m in members if m["filled"] == TOTAL)
summary_rows = "".join(
    f'<tr><td><button class="namelink" data-uid="{esc(m["user_id"])}">'
    f'{esc(m["name"])}</button>'
    + (' <span class="owner">dono</span>' if m["role"] == "owner" else "")
    + f'</td><td class="num">{m["filled"]}/{TOTAL}</td>'
    f'<td class="bar"><div style="width:{m["filled"]/TOTAL*100:.0f}%"></div></td>'
    f'<td class="num">{"✅" if m["filled"]==TOTAL else "⚠️" if m["filled"] else "❌"}</td>'
    '<td class="num"><span class="audit">auditar →</span></td></tr>'
    for m in members
)

stake = f"{float(group['stake_amount']):.0f}"
sc = group["scoring_config"]
doc = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Auditoria · {esc(group['name'])}</title>
<style>
  :root {{ --green:#15803d; --green2:#16a34a; --cream:#faf7ef; --ink:#1c1917;
          --mut:#78716c; --line:#e7e2d6; --bg:#fff; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
         background:var(--cream); color:var(--ink); padding:24px 16px 60px; }}
  .wrap {{ max-width:1200px; margin:0 auto; }}
  header.top h1 {{ font-size:26px; font-weight:900; margin:0 0 4px;
                   text-transform:uppercase; letter-spacing:-.5px; }}
  header.top .meta {{ color:var(--mut); font-size:13px; }}
  .stats {{ display:flex; flex-wrap:wrap; gap:10px; margin:16px 0 24px; }}
  .stat {{ background:var(--bg); border:1px solid var(--line); border-radius:12px;
           padding:10px 16px; min-width:110px; }}
  .stat b {{ display:block; font-size:22px; font-weight:900; color:var(--green); }}
  .stat span {{ font-size:11px; text-transform:uppercase; color:var(--mut);
                font-weight:700; letter-spacing:.5px; }}
  .card {{ background:var(--bg); border:1px solid var(--line); border-radius:14px;
           padding:18px; margin:0 0 22px; }}
  .card h2 {{ font-size:16px; margin:0 0 4px; }}
  .card h2 small {{ font-weight:400; color:var(--mut); font-size:12px; }}
  .hint {{ color:var(--mut); font-size:12px; margin:0 0 12px; }}
  table {{ border-collapse:collapse; width:100%; }}
  .summary td {{ padding:6px 8px; border-bottom:1px solid var(--line); font-size:13px; }}
  .summary .num {{ text-align:center; white-space:nowrap; }}
  .summary .bar {{ width:120px; }}
  .summary .bar div {{ height:8px; background:var(--green2); border-radius:4px; }}
  .namelink {{ background:none; border:none; padding:0; font:inherit; font-weight:700;
               color:var(--green); cursor:pointer; text-decoration:underline;
               text-underline-offset:2px; }}
  .namelink:hover {{ color:var(--green2); }}
  .audit {{ font-size:11px; color:var(--mut); }}
  .owner {{ font-size:10px; background:var(--green); color:#fff; padding:1px 6px;
            border-radius:6px; vertical-align:middle; }}
  .alert td,.alert th {{ padding:6px 10px; border-bottom:1px solid var(--line);
                         font-size:13px; text-align:left; }}
  .alert .num {{ text-align:center; }}
  .alert tr.susp {{ background:#fef2f2; }} .alert tr.susp b {{ color:#b91c1c; }}
  .matrixwrap {{ overflow:auto; border:1px solid var(--line); border-radius:14px;
                 background:var(--bg); max-height:82vh; }}
  table.matrix {{ border-collapse:separate; border-spacing:0; }}
  table.matrix th, table.matrix td {{ border-right:1px solid var(--line);
                                       border-bottom:1px solid var(--line); }}
  table.matrix thead th {{ position:sticky; top:0; background:#f3efe4; z-index:3;
                           padding:6px 4px; font-size:11px; }}
  table.matrix th.m {{ min-width:46px; max-width:46px; cursor:pointer; }}
  table.matrix th.m:hover {{ background:#e8e2d2; }}
  .mname {{ writing-mode:vertical-rl; transform:rotate(180deg); white-space:nowrap;
            max-height:92px; overflow:hidden; margin:0 auto; font-weight:700; }}
  .mfill {{ font-size:9px; color:var(--mut); margin-top:3px; }}
  td.match, th.match {{ position:sticky; left:0; background:var(--bg); z-index:2;
                        min-width:120px; text-align:left; padding:6px 8px; }}
  thead th.match {{ z-index:4; background:#f3efe4; }}
  .teams {{ font-weight:800; font-size:13px; font-variant:tabular-nums; }}
  .teams .x {{ color:var(--mut); font-weight:400; }}
  .dt {{ font-size:10px; color:var(--mut); }}
  .gtag {{ background:#eee7d6; color:var(--mut); border-radius:4px; padding:0 4px;
           font-weight:700; }}
  tr.day td {{ position:sticky; left:0; background:var(--green); color:#fff;
               font-weight:800; font-size:12px; text-transform:uppercase;
               padding:4px 10px; z-index:2; }}
  td.p {{ text-align:center; font-variant:tabular-nums; font-weight:700; font-size:13px;
          padding:5px 4px; white-space:nowrap; }}
  td.p i {{ color:var(--mut); font-style:normal; font-weight:400; margin:0 1px; }}
  td.p.empty {{ color:#d6d3cd; font-weight:400; }}
  footer {{ text-align:center; color:var(--mut); font-size:12px; margin-top:30px; }}
  /* modal por pessoa */
  .ov {{ position:fixed; inset:0; background:rgba(28,25,23,.55); display:none;
         align-items:flex-start; justify-content:center; padding:30px 14px; z-index:50;
         backdrop-filter:blur(2px); }}
  .ov.open {{ display:flex; }}
  .modal {{ background:var(--bg); border-radius:16px; width:100%; max-width:560px;
            max-height:88vh; overflow:auto; box-shadow:0 20px 60px rgba(0,0,0,.3); }}
  .mhead {{ position:sticky; top:0; background:var(--green); color:#fff;
            padding:16px 20px; display:flex; justify-content:space-between;
            align-items:center; z-index:1; }}
  .mhead h3 {{ margin:0; font-size:19px; font-weight:900; }}
  .mhead .sub {{ font-size:12px; opacity:.85; }}
  .mclose {{ background:rgba(255,255,255,.2); border:none; color:#fff; width:32px;
             height:32px; border-radius:50%; font-size:18px; cursor:pointer; }}
  .mbody {{ padding:8px 0 14px; }}
  .mday {{ font-size:11px; font-weight:800; text-transform:uppercase; color:var(--mut);
           background:var(--cream); padding:5px 20px; letter-spacing:.5px; }}
  .game {{ display:flex; align-items:center; gap:10px; padding:8px 20px;
           border-bottom:1px solid var(--line); }}
  .game .tm {{ font-size:11px; color:var(--mut); width:38px; flex:none; }}
  .game .gg {{ font-size:10px; color:var(--mut); background:#eee7d6; border-radius:4px;
              padding:0 4px; flex:none; }}
  .game .nm {{ flex:1; font-size:13px; }}
  .game .nm b {{ font-weight:700; }}
  .game .sc {{ font-variant:tabular-nums; font-weight:800; font-size:15px; flex:none;
              background:var(--cream); border-radius:8px; padding:3px 10px; }}
  .game .sc.no {{ color:#cbb; background:transparent; font-weight:400; }}
  .game .sc .x {{ color:var(--mut); font-weight:400; margin:0 2px; }}
  @media print {{ .ov {{ position:static; display:block; background:none; }}
    .matrixwrap {{ max-height:none; }} }}
</style></head>
<body><div class="wrap">
  <header class="top">
    <h1>Auditoria · {esc(group['name'])}</h1>
    <div class="meta">Codigo <b>{esc(group['invite_code'])}</b> ·
      aposta R$ {esc(stake)} · placar exato {esc(sc.get('exact_score'))} pt /
      vencedor {esc(sc.get('correct_winner'))} pt · gerado em {esc(gen_at)}</div>
  </header>

  <div class="stats">
    <div class="stat"><b>{len(members)}</b><span>Membros</span></div>
    <div class="stat"><b>{TOTAL}</b><span>Jogos (grupos)</span></div>
    <div class="stat"><b>{done}</b><span>Completaram</span></div>
    <div class="stat"><b>{len(preds)}</b><span>Palpites totais</span></div>
  </div>

  {alert_html}

  <section class="card">
    <h2>Preenchimento por membro <small>· clique no nome para auditar a pessoa</small></h2>
    <table class="summary"><tbody>{summary_rows}</tbody></table>
  </section>

  <section class="card" style="padding:0;overflow:hidden">
    <div style="padding:18px 18px 10px"><h2>Matriz de palpites <small>· ordem cronologica</small></h2>
      <p class="hint" style="margin:0">Linhas = jogos do 1o ao ultimo dia. Colunas = membros
        (clique no nome p/ ver a pessoa). Celula = placar (mandante × visitante).
        <span style="color:#d6d3cd">·</span> = nao palpitou.</p></div>
    <div class="matrixwrap">
      <table class="matrix">
        <thead><tr><th class="match">Jogo</th>{head_cols}</tr></thead>
        <tbody>{rows_html}</tbody>
      </table>
    </div>
  </section>

  <footer>Palpiteiro · auditoria do banco real (service role).
    {len(preds)} palpites de {len(members)} membros em {TOTAL} jogos.</footer>
</div>

<div class="ov" id="ov">
  <div class="modal">
    <div class="mhead">
      <div><h3 id="mName"></h3><div class="sub" id="mSub"></div></div>
      <button class="mclose" id="mClose">×</button>
    </div>
    <div class="mbody" id="mBody"></div>
  </div>
</div>

<script>
const DATA = {data_js};
const ov = document.getElementById('ov');
const mBody = document.getElementById('mBody');

function openPerson(uid) {{
  const mem = DATA.members.find(m => m.id === uid);
  if (!mem) return;
  const pr = DATA.pred[uid] || {{}};
  document.getElementById('mName').textContent = mem.name + (mem.owner ? ' 👑' : '');
  document.getElementById('mSub').textContent =
    mem.filled + '/' + DATA.matches.length + ' jogos palpitados';
  let html = '', curDay = null;
  for (const g of DATA.matches) {{
    if (g.day !== curDay) {{ curDay = g.day; html += '<div class="mday">' + g.day + '</div>'; }}
    const p = pr[g.id];
    const sc = p
      ? '<span class="sc">' + p[0] + '<span class="x">×</span>' + p[1] + '</span>'
      : '<span class="sc no">—</span>';
    html += '<div class="game"><span class="tm">' + g.t + '</span>'
      + '<span class="gg">G' + g.g + '</span>'
      + '<span class="nm"><b>' + g.hc + '</b> × <b>' + g.ac + '</b> '
      + '<span style="color:#999">' + g.hn + ' x ' + g.an + '</span></span>'
      + sc + '</div>';
  }}
  mBody.innerHTML = html;
  mBody.scrollTop = 0;
  ov.classList.add('open');
}}
function closeModal() {{ ov.classList.remove('open'); }}

document.querySelectorAll('[data-uid]').forEach(el =>
  el.addEventListener('click', () => openPerson(el.getAttribute('data-uid'))));
document.getElementById('mClose').addEventListener('click', closeModal);
ov.addEventListener('click', e => {{ if (e.target === ov) closeModal(); }});
document.addEventListener('keydown', e => {{ if (e.key === 'Escape') closeModal(); }});
</script>
</body></html>"""

out = "/Users/julioneto/projects/palpiteiro/auditoria-guerreiros.html"
with open(out, "w", encoding="utf-8") as f:
    f.write(doc)
print("OK ->", out)
print(f"membros={len(members)} jogos={TOTAL} palpites={len(preds)} "
      f"completos={done} suspeitos>=75%={n_susp} "
      f"+parecido={pairs[0][0]*100:.0f}%" if pairs else "OK")
