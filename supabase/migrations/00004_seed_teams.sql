-- ============================================================
-- 00004_seed_teams.sql
-- Seed data: 48 teams for the 2026 FIFA World Cup
-- Draw held: December 5, 2025 – Kennedy Center, Washington D.C.
--
-- NOTE: 6 playoff spots were still TBD at the time of the draw.
--   - UEFA Play-off A (Group B): Italy / Wales / N. Ireland / Bosnia
--   - UEFA Play-off B (Group F): Ukraine / Sweden / Poland / Albania
--   - UEFA Play-off C (Group D): Turkey / Romania / Slovakia / Kosovo
--   - UEFA Play-off D (Group A): Denmark / N. Macedonia / Czechia / Ireland
--   - IC Play-off 1 (Group K): DR Congo / Jamaica / New Caledonia
--   - IC Play-off 2 (Group I): Iraq / Bolivia / Suriname
--
-- This seed uses the FAVORITES / highest-ranked candidates for each
-- playoff slot. UPDATE these rows once the playoffs conclude on
-- March 31, 2026.
-- ============================================================

-- Ensure idempotency: clear any previously seeded teams
TRUNCATE public.teams CASCADE;

INSERT INTO public.teams (name, name_en, code, flag_url, group_letter, confederation, fifa_ranking)
VALUES
  -- ========================================
  -- GROUP A
  -- Mexico, South Africa, South Korea, UEFA Play-off D
  -- ========================================
  ('Mexico',            'Mexico',           'MEX', NULL, 'A', 'CONCACAF',  13),
  ('Africa do Sul',     'South Africa',     'RSA', NULL, 'A', 'CAF',       59),
  ('Coreia do Sul',     'South Korea',      'KOR', NULL, 'A', 'AFC',       23),
  ('Dinamarca',         'Denmark',          'DEN', NULL, 'A', 'UEFA',      21),
  -- ^ UEFA Play-off D placeholder (Denmark favored)

  -- ========================================
  -- GROUP B
  -- Canada, UEFA Play-off A, Qatar, Switzerland
  -- ========================================
  ('Canada',            'Canada',           'CAN', NULL, 'B', 'CONCACAF',  41),
  ('Italia',            'Italy',            'ITA', NULL, 'B', 'UEFA',      10),
  -- ^ UEFA Play-off A placeholder (Italy favored)
  ('Catar',             'Qatar',            'QAT', NULL, 'B', 'AFC',       43),
  ('Suica',             'Switzerland',      'SUI', NULL, 'B', 'UEFA',      19),

  -- ========================================
  -- GROUP C
  -- Brazil, Morocco, Haiti, Scotland
  -- ========================================
  ('Brasil',            'Brazil',           'BRA', NULL, 'C', 'CONMEBOL',   5),
  ('Marrocos',          'Morocco',          'MAR', NULL, 'C', 'CAF',       14),
  ('Haiti',             'Haiti',            'HAI', NULL, 'C', 'CONCACAF', 168),
  ('Escocia',           'Scotland',         'SCO', NULL, 'C', 'UEFA',      65),

  -- ========================================
  -- GROUP D
  -- United States, Paraguay, Australia, UEFA Play-off C
  -- ========================================
  ('Estados Unidos',    'United States',    'USA', NULL, 'D', 'CONCACAF',  11),
  ('Paraguai',          'Paraguay',         'PAR', NULL, 'D', 'CONMEBOL',  57),
  ('Australia',         'Australia',        'AUS', NULL, 'D', 'AFC',       24),
  ('Turquia',           'Turkey',           'TUR', NULL, 'D', 'UEFA',      26),
  -- ^ UEFA Play-off C placeholder (Turkey favored)

  -- ========================================
  -- GROUP E
  -- Germany, Curacao, Cote d'Ivoire, Ecuador
  -- ========================================
  ('Alemanha',          'Germany',          'GER', NULL, 'E', 'UEFA',      12),
  ('Curacao',           'Curacao',          'CUW', NULL, 'E', 'CONCACAF', 180),
  ('Costa do Marfim',   'Ivory Coast',      'CIV', NULL, 'E', 'CAF',       39),
  ('Equador',           'Ecuador',          'ECU', NULL, 'E', 'CONMEBOL',  30),

  -- ========================================
  -- GROUP F
  -- Netherlands, Japan, UEFA Play-off B, Tunisia
  -- ========================================
  ('Holanda',           'Netherlands',      'NED', NULL, 'F', 'UEFA',       3),
  ('Japao',             'Japan',            'JPN', NULL, 'F', 'AFC',       15),
  ('Ucrania',           'Ukraine',          'UKR', NULL, 'F', 'UEFA',      22),
  -- ^ UEFA Play-off B placeholder (Ukraine favored)
  ('Tunisia',           'Tunisia',          'TUN', NULL, 'F', 'CAF',       40),

  -- ========================================
  -- GROUP G
  -- Belgium, Egypt, Iran, New Zealand
  -- ========================================
  ('Belgica',           'Belgium',          'BEL', NULL, 'G', 'UEFA',       6),
  ('Egito',             'Egypt',            'EGY', NULL, 'G', 'CAF',       33),
  ('Ira',               'Iran',             'IRN', NULL, 'G', 'AFC',       20),
  ('Nova Zelandia',     'New Zealand',      'NZL', NULL, 'G', 'OFC',      93),

  -- ========================================
  -- GROUP H
  -- Spain, Cabo Verde, Saudi Arabia, Uruguay
  -- ========================================
  ('Espanha',           'Spain',            'ESP', NULL, 'H', 'UEFA',       2),
  ('Cabo Verde',        'Cabo Verde',       'CPV', NULL, 'H', 'CAF',       72),
  ('Arabia Saudita',    'Saudi Arabia',     'KSA', NULL, 'H', 'AFC',       60),
  ('Uruguai',           'Uruguay',          'URU', NULL, 'H', 'CONMEBOL',   9),

  -- ========================================
  -- GROUP I
  -- France, Senegal, Norway, IC Play-off 2
  -- ========================================
  ('Franca',            'France',           'FRA', NULL, 'I', 'UEFA',       4),
  ('Senegal',           'Senegal',          'SEN', NULL, 'I', 'CAF',       17),
  ('Noruega',           'Norway',           'NOR', NULL, 'I', 'UEFA',      46),
  ('Iraque',            'Iraq',             'IRQ', NULL, 'I', 'AFC',       63),
  -- ^ IC Play-off 2 placeholder (Iraq seeded into final)

  -- ========================================
  -- GROUP J
  -- Argentina, Algeria, Austria, Jordan
  -- ========================================
  ('Argentina',         'Argentina',        'ARG', NULL, 'J', 'CONMEBOL',   1),
  ('Argelia',           'Algeria',          'ALG', NULL, 'J', 'CAF',       37),
  ('Austria',           'Austria',          'AUT', NULL, 'J', 'UEFA',      25),
  ('Jordania',          'Jordan',           'JOR', NULL, 'J', 'AFC',       68),

  -- ========================================
  -- GROUP K
  -- Portugal, Uzbekistan, Colombia, IC Play-off 1
  -- ========================================
  ('Portugal',          'Portugal',         'POR', NULL, 'K', 'UEFA',       7),
  ('Uzbequistao',      'Uzbekistan',       'UZB', NULL, 'K', 'AFC',       62),
  ('Colombia',          'Colombia',         'COL', NULL, 'K', 'CONMEBOL',   8),
  ('RD Congo',          'DR Congo',         'COD', NULL, 'K', 'CAF',       56),
  -- ^ IC Play-off 1 placeholder (DR Congo seeded into final)

  -- ========================================
  -- GROUP L
  -- England, Croatia, Ghana, Panama
  -- ========================================
  ('Inglaterra',        'England',          'ENG', NULL, 'L', 'UEFA',       5),
  ('Croacia',           'Croatia',          'CRO', NULL, 'L', 'UEFA',      16),
  ('Gana',              'Ghana',            'GHA', NULL, 'L', 'CAF',       67),
  ('Panama',            'Panama',           'PAN', NULL, 'L', 'CONCACAF',  42)
;
