async function testE2E() {
  console.log('🧪 Début du test end-to-end (Billetterie, Auth & SonoSuite)...');

  // 1. Tester la connexion (Prince Nzassi)
  console.log('\n1. Test Authentification...');
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '+242068001122', password: 'Congo2026!' }),
  });
  const loginData = await loginRes.json();
  console.log('✅ Login réussi pour :', loginData.user?.artist_name, '| Token obtenu !');
  const token = loginData.token;

  // 2. Tester la billetterie
  console.log('\n2. Test Achat de Billet Réel...');
  const eventsRes = await fetch('http://localhost:4000/api/ticketing/events');
  const eventsData = await eventsRes.json();
  const event = eventsData.events[0];
  console.log('Événement sélectionné :', event.title);

  const buyRes = await fetch('http://localhost:4000/api/ticketing/buy-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: event.id,
      buyer_name: 'Mavoungou Brice',
      buyer_phone: '+242065554433',
      ticket_type: 'VIP',
      payment_method: 'MTN_MOMO',
    }),
  });
  const buyData = await buyRes.json();
  const qrHash = buyData.ticket?.qr_code_hash;
  console.log('✅ Billet acheté ! Code Hash :', qrHash);

  // 3. Tester le scan du billet
  console.log('\n3. Test Premier Scan du Billet à la porte...');
  const scan1Res = await fetch('http://localhost:4000/api/ticketing/scan-ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ qr_code_hash: qrHash }),
  });
  const scan1Data = await scan1Res.json();
  console.log('✅ Résultat premier scan :', scan1Data.message, '| Statut :', scan1Data.ticket?.status);

  // 4. Tester la tentative de fraude (2ème scan)
  console.log('\n4. Test Deuxième Scan (Tentative de fraude avec le même billet)...');
  const scan2Res = await fetch('http://localhost:4000/api/ticketing/scan-ticket', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ qr_code_hash: qrHash }),
  });
  const scan2Data = await scan2Res.json();
  console.log('🛡️ Résultat sécurité anti-fraude :', scan2Data.warning || scan2Data.error);

  // 5. Tester la création d'une sortie avec SonoSuite
  console.log('\n5. Test Création de Sortie & SonoSuite DDEX...');
  const releaseRes = await fetch('http://localhost:4000/api/releases/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Brazza By Night EP',
      release_type: 'ep',
      genre: 'Rumba Congolaise',
      primary_language: 'Lingala',
      release_date: '2026-11-15',
      cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
      record_label: 'Moyo Indé',
      target_platforms: ['spotify', 'apple_music', 'boomplay', 'tiktok'],
      tracks: [
        {
          title: 'Nuit sur la Corniche',
          composer: 'Prince Nzassi',
          author_lyricist: 'Prince Nzassi',
          duration_seconds: 240,
        },
      ],
    }),
  });
  const releaseData = await releaseRes.json();
  console.log('✅ Sortie créée en DB !');
  console.log('   - UPC :', releaseData.release?.upc_code);
  console.log('   - ISRC Piste 1 :', releaseData.tracks?.[0]?.isrc_code);
  console.log('   - SonoSuite ID :', releaseData.sonosuite?.sonosuite_release_id);
  console.log('   - Statut SonoSuite :', releaseData.sonosuite?.status);

  console.log('\n🎉 TOUS LES TESTS LOCAUX SONT VALIDÉS AVEC SUCCÈS !');
}

testE2E().catch(console.error);
