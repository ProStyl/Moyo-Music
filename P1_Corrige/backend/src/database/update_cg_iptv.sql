-- SYNCHRONISATION OFFICIELLE DES CHAÎNES & RADIOS DE LA RÉPUBLIQUE DU CONGO 🇨🇬 (IPTV-ORG & FLUX DIRECTS)
DELETE FROM media_stations;

INSERT INTO media_stations (name, type, city, frequency, logo_url, stream_url, is_active, total_broadcasts_detected) VALUES
(
  'Télé Congo (Antenne Nationale - Direct 720p)',
  'TV',
  'Brazzaville',
  'TNT Canal 1 / Satellite / HLS',
  'https://i.imgur.com/r4B5zq4.png',
  'http://51.254.199.122:8080/telecongo/index.m3u8',
  TRUE,
  245
),
(
  'DRTV International (Droits & Libertés TV Brazzaville)',
  'TV',
  'Brazzaville',
  'TNT Canal 4 / Câble / HLS',
  'https://i.imgur.com/rGbTvtZ.png',
  'https://vps122407.serveur-vps.net/hls/drtv.m3u8',
  TRUE,
  182
),
(
  'Beb TV Congo (Musique & Culture 720p)',
  'TV',
  'Brazzaville',
  'Livepush CDN HLS',
  'https://i.imgur.com/3XOk1lP.jpeg',
  'https://live-hls-qunv.livepush.io/live_cdn/em8A-kbzIfHqu73/index.m3u8',
  TRUE,
  115
),
(
  'Ev-tele Congo (Culture & Spectacles 720p)',
  'TV',
  'Brazzaville',
  'PlayTV HLS Stream',
  'https://i.imgur.com/iBlXl2T.png',
  'https://playtv4k.live/live/EVTELE/index.m3u8',
  TRUE,
  94
),
(
  'Esaie 45 Télé (Brazzaville)',
  'TV',
  'Brazzaville',
  'Berosat HLS Live',
  'https://i.imgur.com/nc9QBnD.png',
  'https://stream.berosat.live/hls/esaie45-tv/esaie45-tv.m3u8',
  TRUE,
  76
),
(
  'Top Congo FM (88.4 FM - Direct Rumba & Infos)',
  'RADIO',
  'Brazzaville / Kinshasa',
  '88.4 FM / Icecast MP3',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80',
  'https://topcongofm2.ice.infomaniak.ch/topcongofm2-64.mp3',
  TRUE,
  380
),
(
  'LAVDC (Rumba Congolaise Non-Stop 24/7)',
  'RADIO',
  'Brazzaville',
  'Zeno Media Stream',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80',
  'http://stream.zeno.fm/6ya7cvxnff9uv',
  TRUE,
  310
),
(
  'Radio Mix Congolaise (Soukous & Ndombolo Live)',
  'RADIO',
  'Brazzaville',
  'Zeno Media Stream',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80',
  'https://stream.zeno.fm/qe5g83upga0uv',
  TRUE,
  290
),
(
  'Kolo-Mboka FM (Musique & Divertissement Congo)',
  'RADIO',
  'Brazzaville / Kinshasa',
  'Volticast AAC/MP3',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
  'https://kolo-mbokafm.volticast.net/kolo-mbokafm.mp3',
  TRUE,
  175
),
(
  'Radio Africa Online (Rumba & Soukous 24/7)',
  'RADIO',
  'Brazzaville',
  'RockHost MP3 Direct',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&q=80',
  'https://ssl.rockhost.com/proxy/radioafr?mp=/stream',
  TRUE,
  230
),
(
  'Radio Maria Congo (Brazzaville Direct)',
  'RADIO',
  'Brazzaville',
  'Dreamsite Live Stream',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=200&q=80',
  'https://dreamsiteradiocp2.com/proxy/rmrepdemcongo?mp=/stream',
  TRUE,
  140
),
(
  'RFI Afrique (Direct Musique & Actualités)',
  'RADIO',
  'Brazzaville / Pointe-Noire',
  '93.2 FM / RFI Stream',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&q=80',
  'http://live02.rfi.fr/rfiafrique-64.mp3',
  TRUE,
  450
);
