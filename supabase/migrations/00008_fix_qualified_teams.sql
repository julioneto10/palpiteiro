-- ============================================================
-- 00008_fix_qualified_teams.sql
-- Corrige as selecoes que o seed (00004) chutou nos playoffs e que
-- NAO se classificaram (decididos em mar/2026):
--   Grupo A: Dinamarca (DEN)  -> Chequia (CZE)        [UEFA play-off D]
--   Grupo B: Italia (ITA)     -> Bosnia (BIH)         [UEFA play-off A, venceu a Italia]
--   Grupo F: Ucrania (UKR)    -> Suecia (SWE)         [UEFA play-off B]
-- Mantidos (de fato classificados): Turquia (TUR), RD Congo (COD), Iraque (IRQ).
--
-- Atualiza a linha existente (mesmo id) p/ os jogos da fase de grupos
-- continuarem validos, e troca os jogadores dessas 3 selecoes.
-- ============================================================

UPDATE public.teams
  SET code = 'CZE', name = 'Chequia', name_en = 'Czechia', fifa_ranking = NULL
  WHERE code = 'DEN';
UPDATE public.teams
  SET code = 'BIH', name = 'Bosnia e Herzegovina', name_en = 'Bosnia and Herzegovina', fifa_ranking = NULL
  WHERE code = 'ITA';
UPDATE public.teams
  SET code = 'SWE', name = 'Suecia', name_en = 'Sweden', fifa_ranking = NULL
  WHERE code = 'UKR';

-- Remove jogadores das selecoes que sairam e insere os das que entraram
DELETE FROM public.players
  WHERE team_id IN (SELECT id FROM public.teams WHERE code IN ('CZE', 'BIH', 'SWE'));

INSERT INTO public.players (team_id, name, position)
SELECT t.id, v.name, v.position
FROM (VALUES
  ('CZE','Patrik Schick','FW'),('CZE','Adam Hlozek','FW'),('CZE','Tomas Soucek','MF'),('CZE','Antonin Barak','MF'),('CZE','Mojmir Chytil','FW'),('CZE','Lukas Provod','MF'),
  ('BIH','Edin Dzeko','FW'),('BIH','Ermedin Demirovic','FW'),('BIH','Smail Prevljak','FW'),('BIH','Miralem Pjanic','MF'),('BIH','Sead Kolasinac','DF'),('BIH','Amar Dedic','DF'),
  ('SWE','Alexander Isak','FW'),('SWE','Viktor Gyokeres','FW'),('SWE','Dejan Kulusevski','MF'),('SWE','Anthony Elanga','FW'),('SWE','Emil Forsberg','MF'),('SWE','Lucas Bergvall','MF')
) AS v(code, name, position)
JOIN public.teams t ON t.code = v.code;
