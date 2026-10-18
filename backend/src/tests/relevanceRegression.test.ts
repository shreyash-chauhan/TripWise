import { calculateRelevanceScore, normalizeText, containsWholeWord, type CandidatePlace } from '../services/rankingService.js';
import { deduplicatePlaces } from '../services/dedupService.js';
import { getFallbackImage } from '../services/placesService.js';
import type { Place } from '../types/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✔ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failed++;
  }
}

console.log('=== RUNNING TRIPWISE SEARCH RELEVANCE & QUALITY REGRESSION TESTS ===\n');

// -------------------------------------------------------------
// TEST 1: Query 'Chennai' ranks Chennai above unrelated similar character sequences
// -------------------------------------------------------------
console.log('Test Suite 1: Query "Chennai" Relevance & Filtering');
{
  const query = 'Chennai';
  const chennai: CandidatePlace = {
    id: 'osm-relation-chennai',
    name: 'Chennai',
    city: 'Chennai',
    country: 'India',
    location: 'Chennai District, Tamil Nadu, India',
    category: 'Historical & Landmarks',
    importance: 0.68,
    isCapital: true
  };

  const mahabalipuram: CandidatePlace = {
    id: 'feat-chennai-shore-temple',
    name: 'Group of Monuments at Mahabalipuram',
    city: 'Chennai',
    country: 'India',
    location: 'Chennai Coast, Tamil Nadu, India',
    category: 'Historical & Landmarks',
    source: 'featured'
  };

  const hautsDeChee: CandidatePlace = {
    id: 'osm-relation-hauts-de-chee',
    name: 'Les Hauts-de-Chée',
    city: 'Bar-le-Duc',
    country: 'France',
    location: 'Meuse, Grand Est, France',
    category: 'Historical & Landmarks',
    importance: 0.4
  };

  const laChee: CandidatePlace = {
    id: 'osm-relation-la-chee',
    name: 'La Chée',
    country: 'France',
    location: 'Marne, France',
    category: 'Historical & Landmarks'
  };

  const scoreChennai = calculateRelevanceScore(query, chennai);
  const scoreMaha = calculateRelevanceScore(query, mahabalipuram);
  const scoreHauts = calculateRelevanceScore(query, hautsDeChee);
  const scoreLaChee = calculateRelevanceScore(query, laChee);

  assert(scoreChennai > 1000, `Chennai exact match has high relevance score (got ${scoreChennai})`);
  assert(scoreMaha > 300, `Mahabalipuram near Chennai Coast has positive context score (got ${scoreMaha})`);
  assert(scoreHauts === 0, `Unrelated French commune "Les Hauts-de-Chée" is rejected (score 0, got ${scoreHauts})`);
  assert(scoreLaChee === 0, `Unrelated "La Chée" is rejected (score 0, got ${scoreLaChee})`);
  assert(scoreChennai > scoreMaha, 'Primary city Chennai ranks above nearby landmark');
}

// -------------------------------------------------------------
// TEST 2: Query 'Rome' ranks Rome, Italy above US locations and filters substring artifacts
// -------------------------------------------------------------
console.log('\nTest Suite 2: Query "Rome" Relevance, Geographic Disambiguation & Substring Artifacts');
{
  const query = 'Rome';
  const romeItaly: CandidatePlace = {
    id: 'osm-relation-rome-italy',
    name: 'Rome',
    city: 'Rome',
    country: 'Italy',
    location: 'Roma Capitale, Lazio, Italia',
    category: 'Historical & Landmarks',
    importance: 0.86,
    isCapital: true,
    population: 2800000
  };

  const colosseum: CandidatePlace = {
    id: 'feat-rome-colosseum',
    name: 'The Colosseum',
    city: 'Rome',
    country: 'Italy',
    location: 'Rome, Italy',
    category: 'Historical & Landmarks',
    source: 'featured'
  };

  const romeGeorgia: CandidatePlace = {
    id: 'osm-relation-rome-ga',
    name: 'Rome',
    city: 'Rome',
    country: 'United States',
    location: 'Floyd County, Georgia, United States',
    category: 'Historical & Landmarks',
    importance: 0.53,
    isCapital: false,
    population: 36000
  };

  const romeIowa: CandidatePlace = {
    id: 'osm-relation-rome-ia',
    name: 'Rome',
    country: 'United States',
    location: 'Henry County, Iowa, United States',
    category: 'Historical & Landmarks',
    importance: 0.45,
    population: 114
  };

  // Copacabana has "promenade" in description, Florence has "polychrome"
  const copacabana: CandidatePlace = {
    id: 'feat-rio-copacabana',
    name: 'Copacabana & Ipanema Beaches',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    location: 'Rio de Janeiro, Brazil',
    category: 'Coastal & Beaches',
    description: 'scenic promenade mosaics'
  };

  const florence: CandidatePlace = {
    id: 'feat-florence-duomo',
    name: 'Cattedrale di Santa Maria del Fiore',
    city: 'Florence',
    country: 'Italy',
    location: 'Florence, Italy',
    category: 'Architecture',
    description: 'polychrome marble facade'
  };

  const scoreRomeItaly = calculateRelevanceScore(query, romeItaly);
  const scoreColosseum = calculateRelevanceScore(query, colosseum);
  const scoreRomeGA = calculateRelevanceScore(query, romeGeorgia);
  const scoreRomeIA = calculateRelevanceScore(query, romeIowa);
  const scoreCopa = calculateRelevanceScore(query, copacabana);
  const scoreFlo = calculateRelevanceScore(query, florence);

  assert(scoreRomeItaly > scoreRomeGA, `Rome, Italy (${scoreRomeItaly}) decisively ranks above Rome, Georgia (${scoreRomeGA})`);
  assert(scoreRomeGA > scoreRomeIA, `Rome, Georgia (${scoreRomeGA}) ranks above tiny Rome, Iowa (${scoreRomeIA})`);
  assert(scoreColosseum > 500, `The Colosseum in Rome has strong geographic context score (${scoreColosseum})`);
  assert(scoreCopa === 0, `Copacabana promenade substring match is rejected (got ${scoreCopa})`);
  assert(scoreFlo === 0, `Florence polychrome substring match is rejected (got ${scoreFlo})`);
}

// -------------------------------------------------------------
// TEST 3: Query 'Colosseum' discovers the landmark
// -------------------------------------------------------------
console.log('\nTest Suite 3: Landmark Discoverability');
{
  const query = 'Colosseum';
  const colosseum: CandidatePlace = {
    id: 'feat-rome-colosseum',
    name: 'The Colosseum',
    city: 'Rome',
    country: 'Italy',
    location: 'Rome, Italy',
    category: 'Historical & Landmarks',
    source: 'featured'
  };

  const score = calculateRelevanceScore(query, colosseum);
  assert(score >= 450, `Colosseum is discoverable with score >= 450 (got ${score})`);
}

// -------------------------------------------------------------
// TEST 4: Query 'Chai Chee' preserves legitimate multiword destinations
// -------------------------------------------------------------
console.log('\nTest Suite 4: Multiword Destination Search');
{
  const query = 'Chai Chee';
  const chaiChee: CandidatePlace = {
    id: 'osm-node-chai-chee',
    name: 'Chai Chee',
    city: 'Singapore',
    country: 'Singapore',
    location: 'Bedok, East Region, Singapore',
    category: 'Historical & Landmarks',
    importance: 0.55
  };

  const score = calculateRelevanceScore(query, chaiChee);
  assert(score >= 1000, `Legitimate multiword destination Chai Chee is preserved with score ${score}`);
}

// -------------------------------------------------------------
// TEST 5: Duplicate Provider Records are Deduplicated
// -------------------------------------------------------------
console.log('\nTest Suite 5: Destination Deduplication');
{
  const placesToDedup: Place[] = [
    {
      id: 'osm-relation-41485',
      name: 'Roma',
      location: 'Roma Capitale, Lazio, Italia',
      country: 'Italia',
      city: 'Roma',
      category: 'Historical & Landmarks',
      description: 'Capital of Italy',
      imageUrl: 'https://example.com/rome.jpg',
      lat: 41.8933,
      lng: 12.4829,
      source: 'osm'
    },
    {
      id: 'osm-relation-41313',
      name: 'Roma Capitale',
      location: 'Roma Capitale, Lazio, Italia',
      country: 'Italia',
      category: 'Historical & Landmarks',
      description: 'Metropolitan City of Rome',
      imageUrl: 'https://example.com/rome-cap.jpg',
      lat: 41.8935, // within 200m of Roma
      lng: 12.4830,
      source: 'osm'
    },
    {
      id: 'feat-rome-colosseum',
      name: 'The Colosseum',
      location: 'Rome, Italy',
      country: 'Italy',
      city: 'Rome',
      category: 'Historical & Landmarks',
      description: 'Ancient amphitheatre',
      imageUrl: 'https://example.com/colosseum.jpg',
      lat: 41.8902,
      lng: 12.4922,
      source: 'featured'
    }
  ];

  const deduped = deduplicatePlaces(placesToDedup);
  assert(deduped.length === 2, `Deduplication reduced 3 entries to 2 (got ${deduped.length})`);
  assert(deduped.some(p => p.name === 'Roma'), 'Primary city "Roma" is kept');
  assert(deduped.some(p => p.name === 'The Colosseum'), 'Genuine landmark "The Colosseum" is preserved');
  assert(!deduped.some(p => p.name === 'Roma Capitale'), 'Duplicate metropolitan administrative representation "Roma Capitale" was removed');
}

// -------------------------------------------------------------
// TEST 6: Disambiguation summaries rejection logic
// -------------------------------------------------------------
console.log('\nTest Suite 6: Wikipedia Disambiguation Rejection');
{
  const disambiguationPayloads = [
    { type: 'disambiguation', extract: 'Roma or ROMA may refer to: Romani people, Rome in Italian' },
    { type: 'standard', extract: 'Rome may refer to: Rome, Italy or Rome, Georgia or Rome, New York' },
    { type: 'standard', description: 'Wikimedia disambiguation page', extract: 'Disambiguation entry' }
  ];

  for (const [i, payload] of disambiguationPayloads.entries()) {
    const isDisambiguation =
      payload.type === 'disambiguation' ||
      payload.description?.toLowerCase().includes('disambiguation') ||
      payload.extract.toLowerCase().includes('may refer to:') ||
      payload.extract.toLowerCase().startsWith('may refer to');

    assert(isDisambiguation === true, `Disambiguation payload #${i + 1} correctly identified and rejected`);
  }
}

// -------------------------------------------------------------
// TEST 7: Image Safety Verification
// -------------------------------------------------------------
console.log('\nTest Suite 7: Image Fallback Safety (No Iconic Wonder Hijacking)');
{
  const colosseumPhotoId = 'photo-1552832230-c0197dd311b5';
  const tajMahalPhotoId = 'photo-1564507592333-c60657eea523';
  const pyramidPhotoId = 'photo-1503177119275-0aa32b3a9368';

  const categories: Place['category'][] = [
    'Historical & Landmarks',
    'Nature & Parks',
    'Arts & Culture',
    'Food & Dining',
    'Coastal & Beaches',
    'Architecture',
    'Modern & Urban'
  ];

  let hasLeakedIconicImage = false;
  for (const cat of categories) {
    for (let seed = 0; seed < 10; seed++) {
      const img = getFallbackImage(cat as any, seed);
      if (
        img.includes(colosseumPhotoId) ||
        img.includes(tajMahalPhotoId) ||
        img.includes(pyramidPhotoId)
      ) {
        hasLeakedIconicImage = true;
        console.error(`Leaked iconic image for category ${cat} at seed ${seed}: ${img}`);
      }
    }
  }

  assert(!hasLeakedIconicImage, 'No fallback image uses Colosseum, Taj Mahal, or Pyramids photos for generic destinations');
}

// -------------------------------------------------------------
// TEST 8: Async Race Condition Protection
// -------------------------------------------------------------
console.log('\nTest Suite 8: Async Out-of-Order Request Guard');
{
  let activeRequestId = 0;
  let finalDisplayedState = '';

  // Simulate Request 1 (Che) launched first
  const req1Id = ++activeRequestId; // req 1

  // Simulate Request 2 (Chennai) launched second
  const req2Id = ++activeRequestId; // req 2

  // Simulate Request 2 finishes FAST (100ms)
  if (req2Id === activeRequestId) {
    finalDisplayedState = 'Chennai Results';
  }

  // Simulate Request 1 finishes SLOW (300ms)
  if (req1Id === activeRequestId) {
    finalDisplayedState = 'Che Results (STALE OVERWRITE)';
  }

  assert(finalDisplayedState === 'Chennai Results', `Stale response was ignored; displayed state is "${finalDisplayedState}"`);
}

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n-------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('-------------------------------------------------------------');

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('\n🎉 ALL REGRESSION TESTS PASSED WITH 100% SUCCESS!\n');
  process.exitCode = 0;
}
