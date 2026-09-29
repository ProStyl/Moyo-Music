-- MISE À JOUR DE TOUTES LES RADIOS ET TÉLÉVISIONS AVEC LEURS VRAIS FLUX DISTINCTS
DELETE FROM media_stations;

INSERT INTO media_stations (name, type, city, frequency, logo_url, stream_url, is_active, total_broadcasts_detected) VALUES
(
  'Télé Congo (Antenne Nationale - Direct 720p)',
  'TV',
  'Brazzaville',
  'TNT Canal 1 / Satellite / HLS',
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&q=80',
  'http://51.254.199.122:8080/telecongo/index.m3u8',
  TRUE,
  194
),
(
  'DRTV International (Droits & Libertés TV Brazzaville)',
  'TV',
  'Brazzaville',
  'TNT Canal 4 / HLS Stream',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&q=80',
  'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
  TRUE,
  145
),
(
  'Beb TV Congo (Culture & Musique Live)',
  'TV',
  'Brazzaville',
  'Web HLS 720p',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&q=80',
  'https://live-hls-qunv.livepush.io/live_cdn/em8A-kbzIfHqu73/index.m3u8',
  TRUE,
  82
),
(
  'Digital Congo TV',
  'TV',
  'Brazzaville / Kinshasa',
  'HLS Stream',
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&q=80',
  'http://51.254.199.122:8080/DigitalCongoTV/index.m3u8',
  TRUE,
  112
),
(
  'Antenne A (Musique & Variétés)',
  'TV',
  'Brazzaville / Kinshasa',
  'HLS Direct',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&q=80',
  'http://51.254.199.122:8080/antenne_a-plus/index.m3u8',
  TRUE,
  98
),
(
  'Top Congo FM (88.4 FM - Direct Rumba & Infos)',
  'RADIO',
  'Brazzaville / Kinshasa',
  '88.4 FM / Icecast MP3',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80',
  'https://topcongofm2.ice.infomaniak.ch/topcongofm2-64.mp3',
  TRUE,
  320
),
(
  'LAVDC (Rumba Congolaise Non-Stop 24/7)',
  'RADIO',
  'Brazzaville',
  'Stream ZenoFM',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80',
  'http://stream.zeno.fm/6ya7cvxnff9uv',
  TRUE,
  280
),
(
  'Radio Mix Congolaise (Soukous & Ndombolo Live)',
  'RADIO',
  'Brazzaville',
  'Stream ZenoFM',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
  'https://stream.zeno.fm/qe5g83upga0uv',
  TRUE,
  245
),
(
  'Kolo-Mboka FM (Musique & Divertissement Congo)',
  'RADIO',
  'Brazzaville / Kinshasa',
  'Stream Volticast MP3',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
  'https://kolo-mbokafm.volticast.net/kolo-mbokafm.mp3',
  TRUE,
  165
),
(
  'Radio Africa Online (Soukous & Rumba Vintage)',
  'RADIO',
  'Brazzaville',
  'RockHost MP3',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&q=80',
  'https://ssl.rockhost.com/proxy/radioafr?mp=/stream',
  TRUE,
  210
),
(
  'Radio Maria Congo (Direct)',
  'RADIO',
  'Brazzaville',
  'Dreamsite MP3 Stream',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80',
  'https://dreamsiteradiocp2.com/proxy/rmrepdemcongo?mp=/stream',
  TRUE,
  130
),
(
  'Radio Svein (Musique & Émissions)',
  'RADIO',
  'Brazzaville / Bukavu',
  'Infomaniak MP3',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80',
  'https://radiosvein2.ice.infomaniak.ch/radiosvein2-64.mp3',
  TRUE,
  95
),
(
  'RFI Afrique (Direct Musique & Actualités)',
  'RADIO',
  'Brazzaville / Pointe-Noire',
  '93.2 FM / RFI Stream',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80',
  'http://live02.rfi.fr/rfiafrique-64.mp3',
  TRUE,
  410
);
