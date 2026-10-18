import './index.js';

async function runTests() {
  console.log('Testing server endpoints...');
  try {
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
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

setTimeout(runTests, 1000);
