-- ============================================================
-- 00007_seed_players.sql
-- Principais jogadores (~6 por selecao) das 48 selecoes da Copa 2026,
-- para a selecao de artilheiro nos palpites.
-- Foco em atacantes/meias (mais provaveis de marcar).
-- Idempotente: limpa e recria.
-- ============================================================

DELETE FROM public.players;

INSERT INTO public.players (team_id, name, position)
SELECT t.id, v.name, v.position
FROM (VALUES
  -- Grupo A
  ('RSA','Percy Tau','FW'),('RSA','Lyle Foster','FW'),('RSA','Themba Zwane','MF'),('RSA','Teboho Mokoena','MF'),('RSA','Evidence Makgopa','FW'),('RSA','Mihlali Mayambela','FW'),
  ('KOR','Son Heung-min','FW'),('KOR','Lee Kang-in','MF'),('KOR','Hwang Hee-chan','FW'),('KOR','Cho Gue-sung','FW'),('KOR','Hwang In-beom','MF'),('KOR','Oh Hyeon-gyu','FW'),
  ('DEN','Rasmus Hojlund','FW'),('DEN','Christian Eriksen','MF'),('DEN','Mikkel Damsgaard','MF'),('DEN','Jonas Wind','FW'),('DEN','Andreas Skov Olsen','FW'),('DEN','Pierre-Emile Hojbjerg','MF'),
  ('MEX','Santiago Gimenez','FW'),('MEX','Raul Jimenez','FW'),('MEX','Hirving Lozano','FW'),('MEX','Edson Alvarez','MF'),('MEX','Alexis Vega','FW'),('MEX','Orbelin Pineda','MF'),
  -- Grupo B
  ('CAN','Jonathan David','FW'),('CAN','Alphonso Davies','FW'),('CAN','Cyle Larin','FW'),('CAN','Tajon Buchanan','FW'),('CAN','Stephen Eustaquio','MF'),('CAN','Jonathan Osorio','MF'),
  ('QAT','Almoez Ali','FW'),('QAT','Akram Afif','FW'),('QAT','Hassan Al-Haydos','MF'),('QAT','Karim Boudiaf','MF'),('QAT','Mohammed Muntari','FW'),
  ('ITA','Federico Chiesa','FW'),('ITA','Gianluca Scamacca','FW'),('ITA','Mateo Retegui','FW'),('ITA','Nicolo Barella','MF'),('ITA','Giacomo Raspadori','FW'),('ITA','Lorenzo Pellegrini','MF'),
  ('SUI','Breel Embolo','FW'),('SUI','Xherdan Shaqiri','MF'),('SUI','Granit Xhaka','MF'),('SUI','Ruben Vargas','FW'),('SUI','Zeki Amdouni','FW'),('SUI','Dan Ndoye','FW'),
  -- Grupo C
  ('BRA','Vinicius Junior','FW'),('BRA','Rodrygo','FW'),('BRA','Raphinha','FW'),('BRA','Endrick','FW'),('BRA','Neymar','FW'),('BRA','Bruno Guimaraes','MF'),
  ('SCO','Scott McTominay','MF'),('SCO','John McGinn','MF'),('SCO','Che Adams','FW'),('SCO','Lyndon Dykes','FW'),('SCO','Ryan Christie','MF'),('SCO','Andrew Robertson','DF'),
  ('HAI','Frantzdy Pierrot','FW'),('HAI','Duckens Nazon','FW'),('HAI','Danley Jean Jacques','MF'),('HAI','Derrick Etienne','FW'),('HAI','Carlens Arcus','DF'),
  ('MAR','Achraf Hakimi','DF'),('MAR','Hakim Ziyech','MF'),('MAR','Youssef En-Nesyri','FW'),('MAR','Brahim Diaz','MF'),('MAR','Sofiane Boufal','FW'),('MAR','Azzedine Ounahi','MF'),
  -- Grupo D
  ('AUS','Mathew Leckie','FW'),('AUS','Mitchell Duke','FW'),('AUS','Jackson Irvine','MF'),('AUS','Craig Goodwin','FW'),('AUS','Riley McGree','MF'),('AUS','Harry Souttar','DF'),
  ('USA','Christian Pulisic','FW'),('USA','Folarin Balogun','FW'),('USA','Gio Reyna','MF'),('USA','Weston McKennie','MF'),('USA','Tim Weah','FW'),('USA','Ricardo Pepi','FW'),
  ('PAR','Miguel Almiron','MF'),('PAR','Julio Enciso','FW'),('PAR','Antonio Sanabria','FW'),('PAR','Angel Romero','FW'),('PAR','Gustavo Gomez','DF'),
  ('TUR','Arda Guler','MF'),('TUR','Kenan Yildiz','FW'),('TUR','Hakan Calhanoglu','MF'),('TUR','Kerem Akturkoglu','FW'),('TUR','Baris Alper Yilmaz','FW'),('TUR','Cenk Tosun','FW'),
  -- Grupo E
  ('GER','Jamal Musiala','MF'),('GER','Florian Wirtz','MF'),('GER','Kai Havertz','FW'),('GER','Niclas Fullkrug','FW'),('GER','Leroy Sane','FW'),('GER','Joshua Kimmich','MF'),
  ('CIV','Sebastien Haller','FW'),('CIV','Nicolas Pepe','FW'),('CIV','Franck Kessie','MF'),('CIV','Simon Adingra','FW'),('CIV','Seko Fofana','MF'),('CIV','Wilfried Singo','DF'),
  ('CUW','Leandro Bacuna','MF'),('CUW','Juninho Bacuna','MF'),('CUW','Tahith Chong','MF'),('CUW','Gervane Kastaneer','FW'),('CUW','Kenji Gorre','FW'),
  ('ECU','Enner Valencia','FW'),('ECU','Moises Caicedo','MF'),('ECU','Kendry Paez','MF'),('ECU','Gonzalo Plata','FW'),('ECU','Pervis Estupinan','DF'),('ECU','Kevin Rodriguez','FW'),
  -- Grupo F
  ('NED','Memphis Depay','FW'),('NED','Cody Gakpo','FW'),('NED','Xavi Simons','MF'),('NED','Donyell Malen','FW'),('NED','Wout Weghorst','FW'),('NED','Frenkie de Jong','MF'),
  ('JPN','Kaoru Mitoma','FW'),('JPN','Takefusa Kubo','MF'),('JPN','Daizen Maeda','FW'),('JPN','Ayase Ueda','FW'),('JPN','Junya Ito','FW'),('JPN','Wataru Endo','MF'),
  ('TUN','Youssef Msakni','FW'),('TUN','Hannibal Mejbri','MF'),('TUN','Naim Sliti','FW'),('TUN','Aissa Laidouni','MF'),('TUN','Elyes Skhiri','MF'),
  ('UKR','Mykhailo Mudryk','FW'),('UKR','Artem Dovbyk','FW'),('UKR','Oleksandr Zinchenko','MF'),('UKR','Heorhiy Sudakov','MF'),('UKR','Roman Yaremchuk','FW'),('UKR','Viktor Tsyhankov','FW'),
  -- Grupo G
  ('BEL','Kevin De Bruyne','MF'),('BEL','Romelu Lukaku','FW'),('BEL','Jeremy Doku','FW'),('BEL','Leandro Trossard','FW'),('BEL','Youri Tielemans','MF'),('BEL','Charles De Ketelaere','FW'),
  ('EGY','Mohamed Salah','FW'),('EGY','Omar Marmoush','FW'),('EGY','Trezeguet','FW'),('EGY','Mostafa Mohamed','FW'),('EGY','Mohamed Elneny','MF'),
  ('IRN','Mehdi Taremi','FW'),('IRN','Sardar Azmoun','FW'),('IRN','Alireza Jahanbakhsh','FW'),('IRN','Saman Ghoddos','MF'),('IRN','Karim Ansarifard','FW'),
  ('NZL','Chris Wood','FW'),('NZL','Marko Stamenic','MF'),('NZL','Ben Waine','FW'),('NZL','Matthew Garbett','MF'),('NZL','Liberato Cacace','DF'),
  -- Grupo H
  ('KSA','Salem Al-Dawsari','FW'),('KSA','Firas Al-Buraikan','FW'),('KSA','Saleh Al-Shehri','FW'),('KSA','Mohammed Kanno','MF'),('KSA','Abdullah Otayf','MF'),
  ('CPV','Garry Rodrigues','FW'),('CPV','Ryan Mendes','FW'),('CPV','Bebe','FW'),('CPV','Jamiro Monteiro','MF'),('CPV','Julio Tavares','FW'),
  ('ESP','Lamine Yamal','FW'),('ESP','Nico Williams','FW'),('ESP','Alvaro Morata','FW'),('ESP','Pedri','MF'),('ESP','Dani Olmo','MF'),('ESP','Mikel Oyarzabal','FW'),
  ('URU','Darwin Nunez','FW'),('URU','Federico Valverde','MF'),('URU','Facundo Pellistri','FW'),('URU','Maxi Araujo','FW'),('URU','Rodrigo Bentancur','MF'),('URU','Nicolas de la Cruz','MF'),
  -- Grupo I
  ('FRA','Kylian Mbappe','FW'),('FRA','Antoine Griezmann','FW'),('FRA','Ousmane Dembele','FW'),('FRA','Marcus Thuram','FW'),('FRA','Bradley Barcola','FW'),('FRA','Aurelien Tchouameni','MF'),
  ('IRQ','Aymen Hussein','FW'),('IRQ','Mohanad Ali','FW'),('IRQ','Ali Jasim','MF'),('IRQ','Bashar Resan','MF'),('IRQ','Amir Al-Ammari','MF'),
  ('NOR','Erling Haaland','FW'),('NOR','Martin Odegaard','MF'),('NOR','Alexander Sorloth','FW'),('NOR','Antonio Nusa','FW'),('NOR','Oscar Bobb','FW'),
  ('SEN','Sadio Mane','FW'),('SEN','Nicolas Jackson','FW'),('SEN','Ismaila Sarr','FW'),('SEN','Boulaye Dia','FW'),('SEN','Iliman Ndiaye','FW'),('SEN','Pape Matar Sarr','MF'),
  -- Grupo J
  ('ALG','Riyad Mahrez','FW'),('ALG','Islam Slimani','FW'),('ALG','Said Benrahma','FW'),('ALG','Youcef Belaili','FW'),('ALG','Baghdad Bounedjah','FW'),('ALG','Ramiz Zerrouki','MF'),
  ('ARG','Lionel Messi','FW'),('ARG','Lautaro Martinez','FW'),('ARG','Julian Alvarez','FW'),('ARG','Alexis Mac Allister','MF'),('ARG','Enzo Fernandez','MF'),('ARG','Alejandro Garnacho','FW'),
  ('AUT','Marko Arnautovic','FW'),('AUT','Christoph Baumgartner','MF'),('AUT','Marcel Sabitzer','MF'),('AUT','Michael Gregoritsch','FW'),('AUT','Patrick Wimmer','MF'),
  ('JOR','Mousa Al-Tamari','FW'),('JOR','Yazan Al-Naimat','FW'),('JOR','Ali Olwan','FW'),('JOR','Noor Al-Rawabdeh','MF'),('JOR','Mahmoud Al-Mardi','MF'),
  -- Grupo K
  ('COL','Luis Diaz','FW'),('COL','James Rodriguez','MF'),('COL','Rafael Santos Borre','FW'),('COL','Jhon Duran','FW'),('COL','Jhon Cordoba','FW'),('COL','Juan Fernando Quintero','MF'),
  ('POR','Cristiano Ronaldo','FW'),('POR','Bruno Fernandes','MF'),('POR','Rafael Leao','FW'),('POR','Bernardo Silva','MF'),('POR','Goncalo Ramos','FW'),('POR','Joao Felix','FW'),
  ('COD','Cedric Bakambu','FW'),('COD','Yoane Wissa','FW'),('COD','Silas Katompa','FW'),('COD','Theo Bongonda','FW'),('COD','Chancel Mbemba','DF'),
  ('UZB','Eldor Shomurodov','FW'),('UZB','Abbosbek Fayzullaev','MF'),('UZB','Jaloliddin Masharipov','MF'),('UZB','Igor Sergeev','FW'),('UZB','Oston Urunov','MF'),
  -- Grupo L
  ('CRO','Luka Modric','MF'),('CRO','Andrej Kramaric','FW'),('CRO','Bruno Petkovic','FW'),('CRO','Mario Pasalic','MF'),('CRO','Ante Budimir','FW'),('CRO','Mateo Kovacic','MF'),
  ('GHA','Mohammed Kudus','MF'),('GHA','Inaki Williams','FW'),('GHA','Jordan Ayew','FW'),('GHA','Antoine Semenyo','FW'),('GHA','Thomas Partey','MF'),('GHA','Ernest Nuamah','FW'),
  ('ENG','Harry Kane','FW'),('ENG','Jude Bellingham','MF'),('ENG','Bukayo Saka','FW'),('ENG','Phil Foden','MF'),('ENG','Cole Palmer','MF'),('ENG','Marcus Rashford','FW'),
  ('PAN','Ismael Diaz','FW'),('PAN','Jose Fajardo','FW'),('PAN','Adalberto Carrasquilla','MF'),('PAN','Cecilio Waterman','FW'),('PAN','Michael Murillo','DF')
) AS v(code, name, position)
JOIN public.teams t ON t.code = v.code;
