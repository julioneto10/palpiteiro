-- ============================================================
-- 00005_seed_matches.sql
-- Seed data: 104 matches for the 2026 FIFA World Cup
-- Official FIFA schedule (announced 2025)
-- Dates: June 11 – July 19, 2026
-- All times stored as UTC (TIMESTAMPTZ)
-- ============================================================

-- Ensure idempotency: clear any previously seeded matches
TRUNCATE public.matches CASCADE;

-- Helper: insert group stage matches using team codes
-- We reference teams by code since UUIDs are auto-generated

-- ============================================================
-- GROUP STAGE — MATCHDAY 1 (June 11-17)
-- ============================================================

INSERT INTO public.matches (stage, group_letter, match_number, home_team_id, away_team_id, kickoff_at, stadium, city, country, score_multiplier)
VALUES
-- Jun 11
('group', 'A', 1,
  (SELECT id FROM teams WHERE code = 'MEX'),
  (SELECT id FROM teams WHERE code = 'RSA'),
  '2026-06-11 19:00:00+00', 'Estadio Azteca', 'Cidade do Mexico', 'Mexico', 1.0),

('group', 'A', 2,
  (SELECT id FROM teams WHERE code = 'KOR'),
  (SELECT id FROM teams WHERE code = 'DEN'),
  '2026-06-12 02:00:00+00', 'Estadio Akron', 'Guadalajara', 'Mexico', 1.0),

-- Jun 12
('group', 'B', 3,
  (SELECT id FROM teams WHERE code = 'CAN'),
  (SELECT id FROM teams WHERE code = 'ITA'),
  '2026-06-12 19:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('group', 'D', 4,
  (SELECT id FROM teams WHERE code = 'USA'),
  (SELECT id FROM teams WHERE code = 'PAR'),
  '2026-06-13 01:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

-- Jun 13
('group', 'B', 5,
  (SELECT id FROM teams WHERE code = 'QAT'),
  (SELECT id FROM teams WHERE code = 'SUI'),
  '2026-06-13 19:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

('group', 'C', 6,
  (SELECT id FROM teams WHERE code = 'BRA'),
  (SELECT id FROM teams WHERE code = 'MAR'),
  '2026-06-13 22:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('group', 'C', 7,
  (SELECT id FROM teams WHERE code = 'HAI'),
  (SELECT id FROM teams WHERE code = 'SCO'),
  '2026-06-14 01:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('group', 'D', 8,
  (SELECT id FROM teams WHERE code = 'AUS'),
  (SELECT id FROM teams WHERE code = 'TUR'),
  '2026-06-14 04:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

-- Jun 14
('group', 'E', 9,
  (SELECT id FROM teams WHERE code = 'GER'),
  (SELECT id FROM teams WHERE code = 'CUW'),
  '2026-06-14 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('group', 'F', 10,
  (SELECT id FROM teams WHERE code = 'NED'),
  (SELECT id FROM teams WHERE code = 'JPN'),
  '2026-06-14 20:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

('group', 'E', 11,
  (SELECT id FROM teams WHERE code = 'CIV'),
  (SELECT id FROM teams WHERE code = 'ECU'),
  '2026-06-14 23:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.0),

('group', 'F', 12,
  (SELECT id FROM teams WHERE code = 'UKR'),
  (SELECT id FROM teams WHERE code = 'TUN'),
  '2026-06-15 02:00:00+00', 'Estadio BBVA', 'Monterrey', 'Mexico', 1.0),

-- Jun 15
('group', 'H', 13,
  (SELECT id FROM teams WHERE code = 'ESP'),
  (SELECT id FROM teams WHERE code = 'CPV'),
  '2026-06-15 16:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('group', 'G', 14,
  (SELECT id FROM teams WHERE code = 'BEL'),
  (SELECT id FROM teams WHERE code = 'EGY'),
  '2026-06-15 19:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.0),

('group', 'H', 15,
  (SELECT id FROM teams WHERE code = 'KSA'),
  (SELECT id FROM teams WHERE code = 'URU'),
  '2026-06-15 22:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.0),

('group', 'G', 16,
  (SELECT id FROM teams WHERE code = 'IRN'),
  (SELECT id FROM teams WHERE code = 'NZL'),
  '2026-06-16 01:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

-- Jun 16
('group', 'I', 17,
  (SELECT id FROM teams WHERE code = 'FRA'),
  (SELECT id FROM teams WHERE code = 'SEN'),
  '2026-06-16 19:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('group', 'I', 18,
  (SELECT id FROM teams WHERE code = 'IRQ'),
  (SELECT id FROM teams WHERE code = 'NOR'),
  '2026-06-16 22:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('group', 'J', 19,
  (SELECT id FROM teams WHERE code = 'ARG'),
  (SELECT id FROM teams WHERE code = 'ALG'),
  '2026-06-17 01:00:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 1.0),

('group', 'J', 20,
  (SELECT id FROM teams WHERE code = 'AUT'),
  (SELECT id FROM teams WHERE code = 'JOR'),
  '2026-06-17 04:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

-- Jun 17
('group', 'K', 21,
  (SELECT id FROM teams WHERE code = 'POR'),
  (SELECT id FROM teams WHERE code = 'COD'),
  '2026-06-17 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('group', 'L', 22,
  (SELECT id FROM teams WHERE code = 'ENG'),
  (SELECT id FROM teams WHERE code = 'CRO'),
  '2026-06-17 20:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

('group', 'L', 23,
  (SELECT id FROM teams WHERE code = 'GHA'),
  (SELECT id FROM teams WHERE code = 'PAN'),
  '2026-06-17 23:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('group', 'K', 24,
  (SELECT id FROM teams WHERE code = 'UZB'),
  (SELECT id FROM teams WHERE code = 'COL'),
  '2026-06-18 02:00:00+00', 'Estadio Azteca', 'Cidade do Mexico', 'Mexico', 1.0),

-- ============================================================
-- GROUP STAGE — MATCHDAY 2 (June 18-23)
-- ============================================================

-- Jun 18
('group', 'A', 25,
  (SELECT id FROM teams WHERE code = 'DEN'),
  (SELECT id FROM teams WHERE code = 'RSA'),
  '2026-06-18 16:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('group', 'B', 26,
  (SELECT id FROM teams WHERE code = 'SUI'),
  (SELECT id FROM teams WHERE code = 'ITA'),
  '2026-06-18 19:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

('group', 'B', 27,
  (SELECT id FROM teams WHERE code = 'CAN'),
  (SELECT id FROM teams WHERE code = 'QAT'),
  '2026-06-18 22:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

('group', 'A', 28,
  (SELECT id FROM teams WHERE code = 'MEX'),
  (SELECT id FROM teams WHERE code = 'KOR'),
  '2026-06-19 01:00:00+00', 'Estadio Akron', 'Guadalajara', 'Mexico', 1.0),

-- Jun 19
('group', 'C', 29,
  (SELECT id FROM teams WHERE code = 'SCO'),
  (SELECT id FROM teams WHERE code = 'MAR'),
  '2026-06-19 22:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('group', 'D', 30,
  (SELECT id FROM teams WHERE code = 'USA'),
  (SELECT id FROM teams WHERE code = 'AUS'),
  '2026-06-19 19:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.0),

('group', 'C', 31,
  (SELECT id FROM teams WHERE code = 'BRA'),
  (SELECT id FROM teams WHERE code = 'HAI'),
  '2026-06-20 01:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.0),

('group', 'D', 32,
  (SELECT id FROM teams WHERE code = 'TUR'),
  (SELECT id FROM teams WHERE code = 'PAR'),
  '2026-06-20 04:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

-- Jun 20
('group', 'E', 33,
  (SELECT id FROM teams WHERE code = 'GER'),
  (SELECT id FROM teams WHERE code = 'CIV'),
  '2026-06-20 20:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('group', 'F', 34,
  (SELECT id FROM teams WHERE code = 'NED'),
  (SELECT id FROM teams WHERE code = 'UKR'),
  '2026-06-20 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('group', 'E', 35,
  (SELECT id FROM teams WHERE code = 'ECU'),
  (SELECT id FROM teams WHERE code = 'CUW'),
  '2026-06-21 00:00:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 1.0),

('group', 'F', 36,
  (SELECT id FROM teams WHERE code = 'TUN'),
  (SELECT id FROM teams WHERE code = 'JPN'),
  '2026-06-21 04:00:00+00', 'Estadio BBVA', 'Monterrey', 'Mexico', 1.0),

-- Jun 21
('group', 'G', 37,
  (SELECT id FROM teams WHERE code = 'BEL'),
  (SELECT id FROM teams WHERE code = 'IRN'),
  '2026-06-21 19:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

('group', 'H', 38,
  (SELECT id FROM teams WHERE code = 'ESP'),
  (SELECT id FROM teams WHERE code = 'KSA'),
  '2026-06-21 16:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('group', 'H', 39,
  (SELECT id FROM teams WHERE code = 'URU'),
  (SELECT id FROM teams WHERE code = 'CPV'),
  '2026-06-21 22:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.0),

('group', 'G', 40,
  (SELECT id FROM teams WHERE code = 'NZL'),
  (SELECT id FROM teams WHERE code = 'EGY'),
  '2026-06-22 01:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

-- Jun 22
('group', 'I', 41,
  (SELECT id FROM teams WHERE code = 'FRA'),
  (SELECT id FROM teams WHERE code = 'IRQ'),
  '2026-06-22 21:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.0),

('group', 'J', 42,
  (SELECT id FROM teams WHERE code = 'ARG'),
  (SELECT id FROM teams WHERE code = 'AUT'),
  '2026-06-22 17:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

('group', 'I', 43,
  (SELECT id FROM teams WHERE code = 'NOR'),
  (SELECT id FROM teams WHERE code = 'SEN'),
  '2026-06-23 00:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('group', 'J', 44,
  (SELECT id FROM teams WHERE code = 'JOR'),
  (SELECT id FROM teams WHERE code = 'ALG'),
  '2026-06-23 03:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

-- Jun 23
('group', 'K', 45,
  (SELECT id FROM teams WHERE code = 'POR'),
  (SELECT id FROM teams WHERE code = 'UZB'),
  '2026-06-23 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('group', 'L', 46,
  (SELECT id FROM teams WHERE code = 'ENG'),
  (SELECT id FROM teams WHERE code = 'GHA'),
  '2026-06-23 20:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('group', 'L', 47,
  (SELECT id FROM teams WHERE code = 'PAN'),
  (SELECT id FROM teams WHERE code = 'CRO'),
  '2026-06-23 23:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('group', 'K', 48,
  (SELECT id FROM teams WHERE code = 'COL'),
  (SELECT id FROM teams WHERE code = 'COD'),
  '2026-06-24 02:00:00+00', 'Estadio Akron', 'Guadalajara', 'Mexico', 1.0),

-- ============================================================
-- GROUP STAGE — MATCHDAY 3 (June 24-27)
-- Simultaneous kickoffs within each group
-- ============================================================

-- Jun 24: Groups A, B, C
('group', 'B', 49,
  (SELECT id FROM teams WHERE code = 'SUI'),
  (SELECT id FROM teams WHERE code = 'CAN'),
  '2026-06-24 19:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

('group', 'B', 50,
  (SELECT id FROM teams WHERE code = 'ITA'),
  (SELECT id FROM teams WHERE code = 'QAT'),
  '2026-06-24 19:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.0),

('group', 'C', 51,
  (SELECT id FROM teams WHERE code = 'SCO'),
  (SELECT id FROM teams WHERE code = 'BRA'),
  '2026-06-24 22:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.0),

('group', 'C', 52,
  (SELECT id FROM teams WHERE code = 'MAR'),
  (SELECT id FROM teams WHERE code = 'HAI'),
  '2026-06-24 22:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('group', 'A', 53,
  (SELECT id FROM teams WHERE code = 'DEN'),
  (SELECT id FROM teams WHERE code = 'MEX'),
  '2026-06-25 01:00:00+00', 'Estadio Azteca', 'Cidade do Mexico', 'Mexico', 1.0),

('group', 'A', 54,
  (SELECT id FROM teams WHERE code = 'RSA'),
  (SELECT id FROM teams WHERE code = 'KOR'),
  '2026-06-25 01:00:00+00', 'Estadio BBVA', 'Monterrey', 'Mexico', 1.0),

-- Jun 25: Groups D, E, F
('group', 'E', 55,
  (SELECT id FROM teams WHERE code = 'ECU'),
  (SELECT id FROM teams WHERE code = 'GER'),
  '2026-06-25 20:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('group', 'E', 56,
  (SELECT id FROM teams WHERE code = 'CUW'),
  (SELECT id FROM teams WHERE code = 'CIV'),
  '2026-06-25 20:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.0),

('group', 'F', 57,
  (SELECT id FROM teams WHERE code = 'JPN'),
  (SELECT id FROM teams WHERE code = 'UKR'),
  '2026-06-25 23:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

('group', 'F', 58,
  (SELECT id FROM teams WHERE code = 'TUN'),
  (SELECT id FROM teams WHERE code = 'NED'),
  '2026-06-25 23:00:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 1.0),

('group', 'D', 59,
  (SELECT id FROM teams WHERE code = 'TUR'),
  (SELECT id FROM teams WHERE code = 'USA'),
  '2026-06-26 02:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

('group', 'D', 60,
  (SELECT id FROM teams WHERE code = 'PAR'),
  (SELECT id FROM teams WHERE code = 'AUS'),
  '2026-06-26 02:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

-- Jun 26: Groups G, H, I
('group', 'I', 61,
  (SELECT id FROM teams WHERE code = 'NOR'),
  (SELECT id FROM teams WHERE code = 'FRA'),
  '2026-06-26 19:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('group', 'I', 62,
  (SELECT id FROM teams WHERE code = 'SEN'),
  (SELECT id FROM teams WHERE code = 'IRQ'),
  '2026-06-26 19:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('group', 'H', 63,
  (SELECT id FROM teams WHERE code = 'CPV'),
  (SELECT id FROM teams WHERE code = 'KSA'),
  '2026-06-27 00:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('group', 'H', 64,
  (SELECT id FROM teams WHERE code = 'URU'),
  (SELECT id FROM teams WHERE code = 'ESP'),
  '2026-06-27 00:00:00+00', 'Estadio Akron', 'Guadalajara', 'Mexico', 1.0),

('group', 'G', 65,
  (SELECT id FROM teams WHERE code = 'EGY'),
  (SELECT id FROM teams WHERE code = 'IRN'),
  '2026-06-27 03:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.0),

('group', 'G', 66,
  (SELECT id FROM teams WHERE code = 'NZL'),
  (SELECT id FROM teams WHERE code = 'BEL'),
  '2026-06-27 03:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

-- Jun 27: Groups J, K, L
('group', 'K', 67,
  (SELECT id FROM teams WHERE code = 'COL'),
  (SELECT id FROM teams WHERE code = 'POR'),
  '2026-06-27 23:30:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.0),

('group', 'K', 68,
  (SELECT id FROM teams WHERE code = 'COD'),
  (SELECT id FROM teams WHERE code = 'UZB'),
  '2026-06-27 23:30:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('group', 'L', 69,
  (SELECT id FROM teams WHERE code = 'PAN'),
  (SELECT id FROM teams WHERE code = 'ENG'),
  '2026-06-27 21:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('group', 'L', 70,
  (SELECT id FROM teams WHERE code = 'CRO'),
  (SELECT id FROM teams WHERE code = 'GHA'),
  '2026-06-27 21:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.0),

('group', 'J', 71,
  (SELECT id FROM teams WHERE code = 'ALG'),
  (SELECT id FROM teams WHERE code = 'AUT'),
  '2026-06-28 02:00:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 1.0),

('group', 'J', 72,
  (SELECT id FROM teams WHERE code = 'JOR'),
  (SELECT id FROM teams WHERE code = 'ARG'),
  '2026-06-28 02:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

-- ============================================================
-- KNOCKOUT STAGE — ROUND OF 32 (June 28 - July 3)
-- Teams TBD — home_team_id and away_team_id are NULL
-- ============================================================

('round_of_32', NULL, 73, NULL, NULL,
  '2026-06-28 19:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

('round_of_32', NULL, 74, NULL, NULL,
  '2026-06-29 20:30:00+00', 'Gillette Stadium', 'Boston', 'USA', 1.0),

('round_of_32', NULL, 75, NULL, NULL,
  '2026-06-30 01:00:00+00', 'Estadio BBVA', 'Monterrey', 'Mexico', 1.0),

('round_of_32', NULL, 76, NULL, NULL,
  '2026-06-29 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.0),

('round_of_32', NULL, 77, NULL, NULL,
  '2026-06-30 21:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.0),

('round_of_32', NULL, 78, NULL, NULL,
  '2026-06-30 17:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

('round_of_32', NULL, 79, NULL, NULL,
  '2026-07-01 01:00:00+00', 'Estadio Azteca', 'Cidade do Mexico', 'Mexico', 1.0),

('round_of_32', NULL, 80, NULL, NULL,
  '2026-07-01 16:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.0),

('round_of_32', NULL, 81, NULL, NULL,
  '2026-07-02 00:00:00+00', 'Levis Stadium', 'San Francisco', 'USA', 1.0),

('round_of_32', NULL, 82, NULL, NULL,
  '2026-07-01 20:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.0),

('round_of_32', NULL, 83, NULL, NULL,
  '2026-07-02 23:00:00+00', 'BMO Field', 'Toronto', 'Canada', 1.0),

('round_of_32', NULL, 84, NULL, NULL,
  '2026-07-02 19:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 1.0),

('round_of_32', NULL, 85, NULL, NULL,
  '2026-07-03 03:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.0),

('round_of_32', NULL, 86, NULL, NULL,
  '2026-07-03 22:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.0),

('round_of_32', NULL, 87, NULL, NULL,
  '2026-07-04 01:30:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 1.0),

('round_of_32', NULL, 88, NULL, NULL,
  '2026-07-03 18:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.0),

-- ============================================================
-- ROUND OF 16 (July 4-7)
-- ============================================================

('round_of_16', NULL, 89, NULL, NULL,
  '2026-07-04 21:00:00+00', 'Lincoln Financial Field', 'Filadelfia', 'USA', 1.5),

('round_of_16', NULL, 90, NULL, NULL,
  '2026-07-04 17:00:00+00', 'NRG Stadium', 'Houston', 'USA', 1.5),

('round_of_16', NULL, 91, NULL, NULL,
  '2026-07-05 20:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 1.5),

('round_of_16', NULL, 92, NULL, NULL,
  '2026-07-06 00:00:00+00', 'Estadio Azteca', 'Cidade do Mexico', 'Mexico', 1.5),

('round_of_16', NULL, 93, NULL, NULL,
  '2026-07-06 19:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 1.5),

('round_of_16', NULL, 94, NULL, NULL,
  '2026-07-07 00:00:00+00', 'Lumen Field', 'Seattle', 'USA', 1.5),

('round_of_16', NULL, 95, NULL, NULL,
  '2026-07-07 16:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 1.5),

('round_of_16', NULL, 96, NULL, NULL,
  '2026-07-07 20:00:00+00', 'BC Place', 'Vancouver', 'Canada', 1.5),

-- ============================================================
-- QUARTER-FINALS (July 9-11)
-- ============================================================

('quarter_final', NULL, 97, NULL, NULL,
  '2026-07-09 20:00:00+00', 'Gillette Stadium', 'Boston', 'USA', 2.0),

('quarter_final', NULL, 98, NULL, NULL,
  '2026-07-10 19:00:00+00', 'SoFi Stadium', 'Los Angeles', 'USA', 2.0),

('quarter_final', NULL, 99, NULL, NULL,
  '2026-07-11 21:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 2.0),

('quarter_final', NULL, 100, NULL, NULL,
  '2026-07-12 01:00:00+00', 'Arrowhead Stadium', 'Kansas City', 'USA', 2.0),

-- ============================================================
-- SEMI-FINALS (July 14-15)
-- ============================================================

('semi_final', NULL, 101, NULL, NULL,
  '2026-07-14 19:00:00+00', 'AT&T Stadium', 'Dallas', 'USA', 2.5),

('semi_final', NULL, 102, NULL, NULL,
  '2026-07-15 19:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta', 'USA', 2.5),

-- ============================================================
-- THIRD-PLACE MATCH (July 18)
-- ============================================================

('third_place', NULL, 103, NULL, NULL,
  '2026-07-18 21:00:00+00', 'Hard Rock Stadium', 'Miami', 'USA', 1.5),

-- ============================================================
-- FINAL (July 19)
-- ============================================================

('final', NULL, 104, NULL, NULL,
  '2026-07-19 19:00:00+00', 'MetLife Stadium', 'Nova York', 'USA', 3.0)
;
