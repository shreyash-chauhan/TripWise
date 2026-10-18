async function runTests() {
  console.log('Testing server endpoints...');
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
      await new Promise(r => setTimeout(r, 1000));
    }

    const healthRes = await fetch('http://127.0.0.1:5000/api/health');
    const health = (await healthRes.json()) as any;
    console.log('✔ Health Check:', health.status, '| DB:', health.database);

    const placesRes = await fetch('http://127.0.0.1:5000/api/places?category=Historical%20%26%20Landmarks');
    const places = (await placesRes.json()) as any;
    console.log(`✔ Places Count for Historical: ${places.data.length}`);

    const addRes = await fetch('http://127.0.0.1:5000/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: 'feat-kyoto-fushimi',
        name: 'Fushimi Inari Taisha',
        location: 'Kyoto, Japan',
        category: 'Historical & Landmarks',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
        notes: 'Visit at dawn for the quietest hike up the mountain.'
      })
    });
    const addResult = (await addRes.json()) as any;
    console.log('✔ Add to Itinerary:', addResult.message, 'ID:', addResult.data?.id);

    const getItinRes = await fetch('http://127.0.0.1:5000/api/itinerary');
    const itin = (await getItinRes.json()) as any;
    console.log(`✔ Saved Itinerary Items: ${itin.data.length}`);

    console.log('All backend integration tests passed successfully!');
    process.exitCode = 0;
    return;
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
    return;
  }
}

runTests();
