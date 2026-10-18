async function runTests() {
  console.log('Testing server endpoints & database persistence...\n');
  let testItemId: number | null = null;
  const testPlaceId = 'feat-paris-louvre';

  try {
    // Check if server is already running on port 5000
    let serverRunning = false;
    try {
      const ping = await fetch('http://127.0.0.1:5000/api/health');
      if (ping.ok) serverRunning = true;
    } catch {
      serverRunning = false;
    }

    if (!serverRunning) {
      // Start server dynamically
      await import('./index.js');
      await new Promise(r => setTimeout(r, 1200));
    }

    // 1. Health check
    const healthRes = await fetch('http://127.0.0.1:5000/api/health');
    if (!healthRes.ok) throw new Error(`Health check returned HTTP ${healthRes.status}`);
    const health = (await healthRes.json()) as any;
    console.log('✔ [PASS] Health Check:', health.status, '| DB:', health.database, '| Saved Count:', health.savedItineraryCount);

    // 2. Categories check
    const catRes = await fetch('http://127.0.0.1:5000/api/places/categories');
    if (!catRes.ok) throw new Error(`Categories endpoint returned HTTP ${catRes.status}`);
    const catData = (await catRes.json()) as any;
    const catNames = catData.data.map((c: any) => c.name);
    if (!catNames.includes('Modern & Urban')) throw new Error('Missing "Modern & Urban" in categories response');
    console.log(`✔ [PASS] Categories endpoint returned ${catData.data.length} categories, including "Modern & Urban"`);

    // 3. Search and filter check
    const placesRes = await fetch('http://127.0.0.1:5000/api/places?query=Rome&sort=recommended');
    if (!placesRes.ok) throw new Error(`Places query returned HTTP ${placesRes.status}`);
    const places = (await placesRes.json()) as any;
    console.log(`✔ [PASS] Places query "Rome" returned ${places.data.length} results`);

    // 4. Destination details by ID check
    const detailsRes = await fetch(`http://127.0.0.1:5000/api/places/${testPlaceId}`);
    if (!detailsRes.ok) throw new Error(`Details endpoint returned HTTP ${detailsRes.status}`);
    const details = (await detailsRes.json()) as any;
    if (details.data.id !== testPlaceId) throw new Error('Returned destination ID does not match requested ID');
    console.log(`✔ [PASS] Details by ID: "${details.data.name}" retrieved successfully`);

    // 5. Add to Itinerary
    const addRes = await fetch('http://127.0.0.1:5000/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: testPlaceId,
        name: details.data.name,
        location: details.data.location,
        category: details.data.category,
        imageUrl: details.data.imageUrl,
        notes: 'Pre-book timed tickets to see the Mona Lisa early.'
      })
    });
    if (!addRes.ok) throw new Error(`Add to itinerary returned HTTP ${addRes.status}`);
    const addResult = (await addRes.json()) as any;
    testItemId = addResult.data?.id;
    console.log('✔ [PASS] Add to Itinerary:', addResult.message, '| ID:', testItemId);

    // 6. Duplicate prevention check
    const dupRes = await fetch('http://127.0.0.1:5000/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: testPlaceId,
        name: details.data.name,
        location: details.data.location,
        category: details.data.category,
        imageUrl: details.data.imageUrl
      })
    });
    const dupResult = (await dupRes.json()) as any;
    if (dupResult.data?.id !== testItemId) throw new Error('Duplicate item should return existing record');
    console.log('✔ [PASS] Duplicate addition prevented gracefully (returned existing record ID)');

    // 7. Update Itinerary Item (PATCH)
    const patchRes = await fetch(`http://127.0.0.1:5000/api/itinerary/${testItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Updated: Meet guide at the Pyramid entrance.',
        visitDate: '2026-11-15'
      })
    });
    if (!patchRes.ok) throw new Error(`PATCH itinerary returned HTTP ${patchRes.status}`);
    const patchResult = (await patchRes.json()) as any;
    if (patchResult.data.visitDate !== '2026-11-15') throw new Error('Visit date not updated');
    console.log('✔ [PASS] Update Itinerary Item:', patchResult.message, '| Visit date:', patchResult.data.visitDate);

    // 8. Delete Itinerary Item
    const delRes = await fetch(`http://127.0.0.1:5000/api/itinerary/${testItemId}`, {
      method: 'DELETE'
    });
    if (!delRes.ok) throw new Error(`DELETE itinerary returned HTTP ${delRes.status}`);
    const delResult = (await delRes.json()) as any;
    console.log('✔ [PASS] Delete Itinerary Item:', delResult.message);

    // 9. Verify Itinerary Cleanup (Zero pollution)
    const verifyRes = await fetch('http://127.0.0.1:5000/api/itinerary');
    const verifyData = (await verifyRes.json()) as any;
    const stillHasItem = verifyData.data.some((i: any) => i.id === testItemId || i.placeId === testPlaceId);
    if (stillHasItem) throw new Error('Test item was not completely removed from database');
    console.log('✔ [PASS] Database cleanliness verified: 0 test records remaining');

    console.log('\n🎉 ALL BACKEND ENDPOINT & PERSISTENCE TESTS PASSED WITH 100% SUCCESS!');
    process.exitCode = 0;
    return;
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);

    // Attempt cleanup if failed mid-way
    if (testItemId) {
      try {
        await fetch(`http://127.0.0.1:5000/api/itinerary/place/${testPlaceId}`, { method: 'DELETE' });
      } catch {
        // ignore secondary error
      }
    }

    process.exitCode = 1;
    return;
  }
}

runTests();
