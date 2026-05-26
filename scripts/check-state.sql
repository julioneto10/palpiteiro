-- ============================================================
-- check-state.sql
-- Diagnostico do estado do banco. Cole no SQL Editor do Supabase
-- e rode tudo de uma vez. Da 3 resultados.
-- ============================================================

-- 1) Tabelas que existem no schema public
--    (apos migrations 1-6 voce deve ver: teams, matches, players, profiles,
--     predictions, scorer_predictions, groups, group_members, disputes,
--     messages, reactions, notifications, global_leaderboard, match_events,
--     match_result_audit, bracket_predictions, tournament_result)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2) Seed aplicado? (esperado ~48 selecoes e ~104 jogos)
SELECT
  (SELECT count(*) FROM public.teams)   AS selecoes,
  (SELECT count(*) FROM public.matches) AS jogos;

-- 3) Migration 00006 aplicada? (TODAS as colunas devem ser TRUE)
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='profiles'
            AND column_name='is_admin')                  AS tem_is_admin,
  to_regclass('public.match_result_audit')  IS NOT NULL  AS tem_tabela_auditoria,
  to_regclass('public.bracket_predictions') IS NOT NULL  AS tem_tabela_bracket,
  to_regclass('public.tournament_result')   IS NOT NULL  AS tem_tabela_torneio,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname='apply_match_result') AS tem_funcao_resultado,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname='recompute_totals')   AS tem_funcao_recompute;
